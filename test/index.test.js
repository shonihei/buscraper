var buscraper = require('buscraper');

describe('API', function() {
    describe('#getClass("20174", "CASCS111")', function() {
        it('should return a class object when a valid class name is passed', function(done) {
            buscraper.getClass("20174", "CASCS111", function(err, result) {
                if (err) {
                    done(err);
                }
                else done();
            });
        });
    });

    describe('#getClass("20174", "CASCX999")', function() {
        it('should return error when nonexistent classname is passed' , function(done) {
            buscraper.getClass("20174", "CASCX999", function(err, result) {
                if (err) {
                    done();
                }
                else done(new Error("Should have failed"));
            });
        });
    });

    describe('#getClass("20174", "CASXS999")', function() {
        it('should return error when nonexistent classname is passed' , function(done) {
            buscraper.getClass("20174", "CASXS999", function(err, result) {
                if (err) {
                    done();
                }
                else done(new Error("Should have failed"));
            });
        });
    });
});
