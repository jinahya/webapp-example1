'use-scrict';

var del = require('del');
//var fs = require('fs');
var imageminpngquant = require('imagemin-pngquant');
var mainbowerfiles = require('main-bower-files');
var mergestream = require('merge-stream');

var gulp = require('gulp');
var gulpbabel = require('gulp-babel');
var gulpcleancss = require('gulp-clean-css');
var gulpcoffee = require('gulp-coffee');
var gulpconcat = require('gulp-concat');
var gulpdebug = require('gulp-debug');
var gulphtmlmin = require('gulp-htmlmin');
var gulpimagemin = require('gulp-imagemin');
var gulpjshint = require('gulp-jshint');
var gulprename = require('gulp-rename');
var gulpsass = require('gulp-sass');
var gulptypescript = require('gulp-typescript');
var gulpuglify = require('gulp-uglify');
var gulputil = require('gulp-util');
var gulpzip = require('gulp-zip');

var src_exclude = ['!src/bower_components{,/**}'];

var paths = {
  src: 'src',
  src_markups: ['src/**/*.html'].concat(src_exclude),
  src_images: ['src/images/**/*.png', 'src/images/**/*.jpg', 'src/images/**/*.svg'].concat(src_exclude),
  src_javascripts: ['src/scripts/**/*.js'].concat(src_exclude),
  src_javascripts_es2015: ['src/scripts.es2015/**/*.js'].concat(src_exclude),
  src_coffeescripts: ['src/scripts/**/*.coffee'].concat(src_exclude),
  src_typescripts: ['src/scripts/**/*.ts'].concat(src_exclude),
  src_css: ['src/styles/**/*.css'].concat(src_exclude),
  src_sass: ['src/styles/**/*.scss'].concat(src_exclude),
  dst: 'dst',
  dst_markups: 'dst',
  dst_configs: "dst/configs",
  dst_images: 'dst/images',
  dst_scripts: 'dst/scripts',
  dst_scripts_es2015: 'dst/scripts.es2015',
  dst_styles: 'dst/styles',
  dpl: 'dpl'
};

gulputil.log("NODE_ENV: " + process.env.NODE_ENV);
var environment = process.env.NODE_ENV || (gulputil.env.environment || 'production');
gulputil.log('environment: ' + environment);
process.env.NODE_ENV = environment;

// deletes dst/ and dpl/
gulp.task('clean', function () {
  return del.sync([paths.dst + '/**', paths.dpl + '/**']);
});

// processes image files
gulp.task('images', function () {
  return gulp.src(paths.src_images)
          .pipe(gulpdebug({title: 'images'}))
          .pipe(gulpimagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [imageminpngquant()]
          }))
          .pipe(gulp.dest(paths.dst_images));
});

// copies bower main files while preseving directory structures
gulp.task("mainbowerfiles", function () {
  return gulp.src(mainbowerfiles(), {base: paths.src + '/bower_components'})
          .pipe(gulpdebug({title: 'mainbowerfiles'}))
          .pipe(gulp.dest(paths.dst + '/bower_components'));
});

// processes javascripts, coffeescripts, and typescripts
gulp.task('scripts.es2015', function () {
  return  gulp.src(paths.src_javascripts_es2015).pipe(gulpbabel({presets: ['es2015']})).pipe(gulpjshint())
          //.pipe(gulpuglify())
          .pipe(gulp.dest(paths.dst_scripts_es2015));
});

// processes javascripts, coffeescripts, and typescripts
gulp.task('scripts', ['scripts.es2015'], function () {
  return mergestream(
          (gulp.src(paths.src_javascripts).pipe(gulpjshint())),
          (gulp.src(paths.src_coffeescripts).pipe(gulpcoffee({bare: true}).on('error', gulputil.log))),
          (gulp.src(paths.src_typescripts).pipe(gulptypescript())))
          .pipe(gulpuglify())
          .pipe(gulp.dest(paths.dst_scripts));
});

// processes style files
gulp.task('styles', function () {
  return mergestream(
          (gulp.src(paths.src_css)),
          (gulp.src(paths.src_sass).pipe(gulpsass().on('error', gulpsass.logError))))
          .pipe(gulpcleancss({debug: true}, function (details) {
            console.log(details.name + ': ' + details.stats.originalSize);
            console.log(details.name + ': ' + details.stats.minifiedSize);
          }))
          .pipe(gulpdebug({title: 'styles'}))
          .pipe(gulp.dest(paths.dst_styles));
});

// processes markup files
gulp.task('markups', function () {
  return gulp.src(paths.src_markups)
          .pipe(gulphtmlmin({collapseWhitespace: true}))
          .pipe(gulp.dest(paths.dst_markups));
});

// copies ./src/configs/default-<environment>.json to ./dst/configs/default.json
gulp.task('config-default', function () {
  return gulp.src([paths.src + '/configs/default-' + environment + '.json'])
          .pipe(gulpdebug({title: 'config-default'}))
          .pipe(gulprename('default.json'))
          .pipe(gulp.dest(paths.dst_configs));
});

// archives
gulp.task('archive', ['markups', 'images', 'scripts', 'styles', 'mainbowerfiles', 'config-default'], function () {
  return gulp.src('**/*', {cwd: paths.dst, cwdbase: true})
          .pipe(gulpzip('archive.zip'))
          .pipe(gulp.dest(paths.dpl));
});

gulp.task('default', ['archive'], function () {
});

// just for NetBeans' default behavior
gulp.task('build', ['default'], function () {
});

