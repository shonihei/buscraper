// REFACTORRRRRR!
// Fix getClasses API so that if one getClass call fails, it will return everything else
// that succeeded.

var request = require('request');
var async = require('async');
var cheerio = require('cheerio');

module.exports = {
    getClass
}

const classTypes = {
    "Applied Art": "APP",
    "Discussion": "DIS",
    "Experience": "EXP",
    "Independent": "IND",
    "Lab": "LAB",
    "Lecture": "LEC",
    "Other": "OTH",
    "Pre-Lab": "PLB"
}

function getClass(semester, input, doneCallback) {
    input = input.toUpperCase();

    let college = input.slice(0, 3);
    let dept = input.slice(3, 5);
    let coursenumber = input.slice(5);
    let semesterID = semester;

    // Parse and validate the input
    // Check input length is equal to 8
    if(input.length !== 8) {
        return doneCallback('Invalid class format : ' + input);
    }

    // All chars in college and dept must be letters
    // All chars in coursenumber and semesterID must be numbers
    let isLetters = (/^[A-Za-z]+$/.test(college + dept))
    let isNumbers = (/^[0-9]+$/.test(coursenumber + semesterID))

    // if either of the restrictions are violated, return error message
    if (!isLetters || !isNumbers) {
        return doneCallback('Invalid class format : ' + input);
    }

    // Object that will be returned
    let newClass = new Object();
    newClass.courseID = input;
    newClass.sections = Object();
    let targetPreviouslyFound = false;
    let finished = false;

    //Initialize asynchrnous queue
    var q = async.queue(function (task, queueCallback) {
        // Define work for each asynchrnous worker
        request(task, function (error, response, body) {

            // Request returned successful
            if (!error && response.statusCode == 200) {
                let $ = cheerio.load(body);

                // Check title of the page is not error
                let title = $("title").text();

                if (title == "Error") {
                    return queueCallback('\"' + input + '\" does not exist.');
                }

                // Get table rows from the page
                let mainTableRows = $('table').find('tr[align="center"][valign="top"]');
                let classesInfo = mainTableRows.slice(0, -1);

                // Checking if next page needs to be loaded
                let nextPageInfo = mainTableRows.slice(-1);
                let nextPagePointsTo = [];
                let nextPageInfoCollection = $(nextPageInfo).find('input[type="text"]');

                async.each(nextPageInfoCollection, function(textbox, NPeachCallback) {
                    nextPagePointsTo.push($(textbox).attr('value'));
                    NPeachCallback();
                }, function (err) {
                    if (err) return queueCallback("Inexplicable Error Occured");
                    let nextPageStartsWith = nextPagePointsTo.join('');
                    if (nextPageStartsWith.includes(input)) {
                        let nextsection = nextPageStartsWith.slice(8);
                        let nextUrl = "https://www.bu.edu/link/bin/uiscgi_studentlink.pl/1483972520?ModuleName=univschr.pl&SearchOptionDesc=Class+Number&SearchOptionCd=S&KeySem=" + semesterID + "&ViewSem=Spring+2017&College=" + college + "&Dept=" + dept + "&Course=" + coursenumber + "&Section=" + nextsection;

                        q.push(nextUrl, function(err, done) {
                            if(err) {
                                doneCallback(err);
                            }
                            else {
                                if(done) {
                                    doneCallback(null, newClass);
                                }
                            }
                        })
                    }
                });

                // .each iterates through every row which may or may not be the class we're targeting
                // .eachOf iterates through every table data within each row to extract data.
                async.each(classesInfo, function(tr, eachCallback) {
                    let newSection = new Object();
                    let skip = false;
                    let days = [];
                    let startTimes = [];
                    let endTimes = [];

                    async.eachOf($(tr).children('td'), function(td, i, eachOfCallback) {
                        if (i==1) {
                            let cID = $(td).text().replace(/\s/, '').replace(' ', '');
                            let sID = cID.slice(8);

                            if (sID == '') {
                                skip = true;
                                eachOfCallback();
                            }
                            else if (!(cID.includes(input))) {
                                if(!targetPreviouslyFound) {
                                    eachOfCallback('\"' + input + '\" does not exist.');
                                }
                                else {
                                    finished = true;
                                    skip = true;
                                    eachOfCallback();
                                }
                            }
                            else {
                                newSection.sectionID = sID;
                                newSection.courseID = cID;
                                targetPreviouslyFound = true;
                                eachOfCallback();
                            }
                        }
                        else if (i == 2) {
                            var split = $(td).contents().html().split('<br>');
                            newSection.title = split[0].replace(/&#xA0;/g, " ").trim();
                            if (split.length > 1) {
                                newSection.instructor = $(split[1]).text().trim();
                            }
                            eachOfCallback();
                        }
                        else if(i==4) {
                            var crdt = $(td).text().trim();
                            newSection.credits = crdt;
                            eachOfCallback();
                        }
                        else if(i==5) {
                            var tpe = $(td).text().trim();
                            if (tpe in classTypes) {
                                newSection.type = classTypes[tpe];
                            }
                            else {
                                newSection.type = "OTH";
                            }
                            eachOfCallback();
                        }
                        else if(i==6) {
                            var opnsts = $(td).text().trim();
                            newSection.openSeats = opnsts;
                            eachOfCallback();
                        }
                        else if(i==9) {
                            var split = $(td).contents().html().split('<br>');
                            $(split).each(function(i, value) {
                                days.push(value);
                            });
                            eachOfCallback();
                        }
                        else if(i==10) {
                            var split = $(td).contents().html().split('<br>');
                            $(split).each(function(i, value) {
                                startTimes.push(value.trim());
                            });
                            eachOfCallback();
                        }
                        else if(i==11) {
                            var split = $(td).contents().html().split('<br>');
                            $(split).each(function(i, value) {
                                endTimes.push(value);
                            })
                            var tms = new Object();
                            $(days).each(function(int, val) {
                                tms[val] = {
                                    "start" : startTimes[int],
                                    "end" : endTimes[int]
                                }
                            })
                            newSection.times = tms;
                            eachOfCallback();
                        }
                        else {
                            eachOfCallback();
                        }
                    }, function(err) {
                        if (err) return eachCallback(err);
                        // Adding Sections to Class Object here
                        if (!skip) {
                            if (newSection.type in newClass.sections) {
                                newClass.sections[newSection.type].push(newSection);
                            }
                            else {
                                newClass.sections[newSection.type] = [newSection];
                            }
                        }
                        eachCallback();
                    });
                }, function(err) {
                    if (err) return queueCallback(err);
                    if (finished) {
                        queueCallback(null, true);
                    }
                    else {
                        queueCallback(null, false);
                    }
                });
            }
            else {
                callback('Not Connected to the Internet');
            }
        });
    }, 10);

    // Creating url
    var url = "https://www.bu.edu/link/bin/uiscgi_studentlink.pl/1483972520?ModuleName=univschr.pl&SearchOptionDesc=Class+Number&SearchOptionCd=S&KeySem=" + semesterID + "&ViewSem=Spring+2017&College=" + college + "&Dept=" + dept + "&Course=" + coursenumber + "&Section=";

    // Pushing initial url
    q.push(url, function(err, done) {
        if(err) {
            doneCallback(err);
        }
        else {
            if(done) {
                doneCallback(null, newClass);
            }
        }
    })
}
