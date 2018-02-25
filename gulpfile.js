const gulp = require('gulp');
const eslint = require('gulp-eslint');
const depcheck = require('gulp-depcheck');
const jest = require('gulp-jest').default;
const { noop } = require('lodash/noop');

/* eslint: arrow-body-style:0 */
gulp.task('eslint', () => {
  return gulp.src(['**/**.js', '!node_modules/**', '!coverage/**', '!logs', '!.vscode'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('depcheck', depcheck({
  ignoreMatches: ['eslint-config-*']
}));

gulp.task('jest', () => {
  process.env.NODE_ENV = 'test';
  return gulp.src('tests').pipe(jest({
    preprocessorIgnorePatterns: [
      '<rootDir>/node_modules/'
    ],
    automock: false
  }));
});

gulp.task('test', ['depcheck', 'eslint', 'jest'], noop);
