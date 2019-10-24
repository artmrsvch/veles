const {src, dest, task, series, watch, parallel} = require('gulp');
const rm = require( 'gulp-rm');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const px2rem = require('gulp-smile-px2rem');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
const gulpif = require('gulp-if');

const env = process.env.NODE_ENV;

const {DIST_PATH, SRC_PATH, STYLES_LIBS, JS_LIBS} = require('./gulp.config');



sass.compiler = require('node-sass');


task('clean', ()=> {
    console.log(env);
    return src('dist/**/*', { read: false }).pipe(rm());
});

task('copy:html', ()=> {
    return src('src/*.html')
    .pipe(dest('dist'))
    .pipe(reload({ stream: true }));
});
task('copy:fonts', ()=> {
    return src('src/fonts/*')
    .pipe(dest('dist/fonts'))
    .pipe(reload({ stream: true }));
});
task('copy:icons', ()=> {
    return src('src/images/img/*')
    .pipe(dest('dist/images/img'))
    .pipe(reload({ stream: true }));
});
task('copy:favicon', ()=> {
    return src('src/images/favicon/*')
    .pipe(dest('dist/images/favicon'))
    .pipe(reload({ stream: true }));
});



const styles = [
    'node_modules/normalize.css/normalize.css',
    'src/styles/main.scss'
];

task('styles', ()=> {
    return src(styles)
    .pipe(gulpif(env == 'dev', sourcemaps.init()))
    .pipe(concat('main.min.scss'))
    .pipe(sassGlob())
    .pipe(sass().on('error', sass.logError))
    //.pipe(px2rem())
    .pipe(gulpif(env == 'dev',
        autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        })))
    .pipe(gulpif(env == 'prod', gcmq()))
    .pipe(gulpif(env == 'prod', cleanCSS({compatibility: 'ie8'})))
    .pipe(gulpif(env == 'dev', sourcemaps.write()))
    .pipe(dest('dist'))
    .pipe(reload({stream : true}))
});

const libs = [
    'node_modules/jquery/dist/jquery.js',
    'src/scripts/*.js'
];

task('scripts', ()=>{
    return src(libs)
    .pipe(gulpif(env == 'dev', sourcemaps.init()))
    .pipe(concat('main.min.js', {newLine: ';'}))
    .pipe(gulpif(env == 'prod', babel({
            presets: ['@babel/env']
        })))
    .pipe(gulpif(env == 'prod', uglify()))
    .pipe(gulpif(env == 'dev', sourcemaps.write()))
    .pipe(dest('dist'))
    .pipe(reload({stream : true}));
})

task('icons', ()=> {
    return src('src/images/*.svg')
    .pipe(svgo({
        plugins: [
            {
                removeAttrs: {attrs: '(fill|stroke|style|width|height|data.*)'}
            }
        ]
    })
    )
    .pipe(svgSprite({
        mode: {
            symbol: {
                sprite: '../sprite.svg'
            }
        }
    }))
    .pipe(dest('dist/images'));
})

task('server', ()=> {
    browserSync.init({
        server: {
            baseDir: "./dist"
        },
        open: false
    });
});
task('watch', ()=> {
    watch('./src/styles/**/*.scss', series('styles'));
    watch('./src/*.html', series('copy:html'));
    watch('./src/scripts/*.js', series('scripts'));
    watch('./src/images/*.svg', series('icons'));
});
task('default',
    series(
        'clean',
        parallel('copy:html', 'copy:fonts', 'copy:icons', 'copy:favicon', 'styles', 'scripts', 'icons'),
        parallel('watch', 'server')
    )
);

task('build',
    series(
        'clean',
        parallel('copy:html', 'copy:fonts', 'copy:icons', 'copy:favicon', 'styles', 'scripts', 'icons'))
);



