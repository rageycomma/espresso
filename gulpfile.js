const   gulp = require('gulp'),
        gutil = require('gulp-util'),
        exec = require('child_process').exec;
        watch = require('gulp-watch');

gulp.task('default',(cb)=>{    
    exec("node --inspect-brk beta/espresso.server",(err,stdout,stderr)=>{
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
    gulp.watch("beta/*.js",()=>{
        console.log("Changes, motherfucker!");
        exec("node --inspect-brk beta/espresso.server");
        exec("killall node");
    });
});

