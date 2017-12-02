const   gulp = require('gulp'),
        git = require('gulp-git'),
        jest = require('gulp-jest').default,
        prompt = require('gulp-prompt'),
        del = require('del'), 
        install = require('gulp-install');

gulp.task('cleanmodules',()=>{
    return del([
        'node_modules',
        '!node_modules/gulp',
        '!node_modules/gulp-jest',
        '!node_modules/del',
        '!node_modules/gulp-install',
        '!node-modules/jest-cli'
    ]);
});

gulp.task('installmodules',()=>{
    return gulp.src(['./package.json'])
        .pipe(install());
});

gulp.task('add', function(){
  return gulp.src('')
    .pipe(git.add());
});

gulp.task('commit', function(){
    return gulp.src('')
        .pipe(prompt.prompt({
            type: 'input',
            name: 'commit_message',
            message: 'Please enter a value for the commit.'
        },(res) =>  {
            return gulp.src('')
            .pipe(git.commit(res.commit_message));
        }));
        
});


gulp.task('jest',()=>{
    return gulp.src('')
    .pipe(
        jest({
            "preprocessorIgnorePatterns": [
                "<rootDir>/dist/", "<rootDir>/node_modules/","<rootDir>/__tests__/coverage"
            ],
            "automock": false
        })
    );
});
