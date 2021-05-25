#!/usr/bin/env node

/* jslint node:true */
/* global it:false */
/* global xit:false */
/* global describe:false */
/* global before:false */
/* global after:false */

'use strict';

require('chromedriver');

var execSync = require('child_process').execSync,
    expect = require('expect.js'),
    path = require('path'),
    superagent = require('superagent');

var chrome = require('selenium-webdriver/chrome'),
    Builder = require('selenium-webdriver').Builder;

describe('Application life cycle test', function () {
    this.timeout(0);

    let browser;
    var LOCATION = 'test';
    var app;

    let BASIC_AUTH_USER = "admin";
    let BASIC_AUTH_PASS = "changeme123";

    let options = new chrome.Options();
    options.windowSize({ width: 1280, height: 1024 });

    before(function (done) {
        if (!process.env.USERNAME) return done(new Error('USERNAME env var not set'));
        if (!process.env.PASSWORD) return done(new Error('PASSWORD env var not set'));

        browser = new Builder().forBrowser('chrome').setChromeOptions(options).build();

        done();
    });

    after(function (done) {
        browser.quit();
        done();
    });

    function checkTwitterBridge(done) {
        superagent.get(`https://${app.fqdn}/?action=display&bridge=Twitter&context=By+username&u=jack&format=Json`)
            .auth(BASIC_AUTH_USER, BASIC_AUTH_PASS)
            .end(function (error, result) {
                expect(error).to.be(null);
                expect(result.status).to.eql(200);
                expect(result.body.home_page_url).to.eql("https://twitter.com/jack");

                done();
        });
    }

    xit('build app', function () {
        execSync('cloudron build', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('install app', function () {
        execSync('cloudron install --location ' + LOCATION, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('can get app information', function () {
        var inspect = JSON.parse(execSync('cloudron inspect'));

        app = inspect.apps.filter(function (a) { return a.location === LOCATION; })[0];

        expect(app).to.be.an('object');
    });

    it('can get the main page', function (done) {
        superagent.get('https://' + app.fqdn).auth(BASIC_AUTH_USER, BASIC_AUTH_PASS).end(function (error, result) {
            expect(error).to.be(null);
            expect(result.status).to.eql(200);

            done();
        });
    });

    it('can use the Twitter bridge', checkTwitterBridge);

    it('can restart app', function (done) {
        execSync('cloudron restart --app ' + app.id);
        done();
    });

    it('backup app', function () {
        execSync('cloudron backup create --app ' + app.id, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('restore app', function () {
        const backups = JSON.parse(execSync(`cloudron backup list --app ${app.id} --raw`));
        execSync('cloudron uninstall --app ' + app.id, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
        execSync('cloudron install --location ' + LOCATION, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
        var inspect = JSON.parse(execSync('cloudron inspect'));
        app = inspect.apps.filter(function (a) { return a.location === LOCATION; })[0];
        execSync(`cloudron restore --backup ${backups[0].id} --app ${app.id}`, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('can use the Twitter bridge', checkTwitterBridge);

    it('uninstall app', function () {
        execSync('cloudron uninstall --app ' + app.id, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    // test update
    it('can install previous version from appstore', function () {
        execSync('cloudron install --appstore-id com.rssbridgeapp.cloudronapp --location ' + LOCATION, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
        var inspect = JSON.parse(execSync('cloudron inspect'));
        app = inspect.apps.filter(function (a) { return a.location === LOCATION; })[0];
        expect(app).to.be.an('object');
    });

    it('can use the Twitter bridge', checkTwitterBridge);

    it('can update', function () {
        execSync('cloudron update --app ' + LOCATION, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });

    it('can use the Twitter bridge', checkTwitterBridge);

    it('uninstall app', function () {
        execSync('cloudron uninstall --app ' + app.id, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    });
});
