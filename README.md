# buscraper
node.js module for collecting BU class related information
Given a semester code (will be explained in the usage section) and the class code, this module will collect everything from professor names, sections, times and open seats.

## Installation
This is module is published on npm so installation is very simple.
Just open up a terminal that has npm CLI installed and execute the following command in the project directory.
```
npm install buscraper
```
or if you have a package.json and you want to add the dependency right to the json file, execute the following.
```
npm install buscraper --save
```

## Usage

Once you have installed the package through npm, you can add the following lines in order to start fetching course informations.

#### Semester code
Semester code is a string input that will be parsed by the package in order to determine what year and semester it will look for. It should follow the following syntax: "{ year }{ semester }"

Year is 4 digit integers that represent an ending year (e.g. "2017", "2018", "2019", etc...) of class year.
- Academic year 2017 to 2018 => "2018"
- Academic year 2019 to 2020 => "2020"

Semester is a 1 digit integer that represents some semester:
- Summer 1 => "1"
- Summer 2 => "2"
- Fall => "3"
- Spring => "4"

Therefore, if you were looking for a information for a class in Fall semester of academic year 2017 to 2018, then you'd input:
```
"20183"
```

#### Class Code
Class code is the second input to the package. Class code has the syntax of:
"{ College }{ Department }{ Class Number }"

College is 3 characters long string:
- "CAS"
- "CFA"
- "CGS"
- "COM"
- etc...

Department is 2 characters long string:
- Computer Science => "CS"
- Math => "MA"
- Physics => "PY"
- etc...

Class Number is 3 characters long string that consists of intergers:
- "111"
- "330"
- etc...

``` javascript
var buscraper = require('buscraper');

var classInfo = Object();
var semesterCode = "20184"; // Spring semester for academic year 2017 to 2018

var classCode = "CASCS111";

buscraper.getClass(semesterCode, classCode, function(err, result) {
    if (err) {
        console.log(err);
    }
    else {
        classInfo = result;
    }
});
```
