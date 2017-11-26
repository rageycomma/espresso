const   gulp = require('gulp'),
        jest = require('gulp-jest').default,
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
