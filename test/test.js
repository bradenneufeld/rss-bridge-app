#!/usr/bin/env node

/* jslint node:true */
/* global it:false */
/* global xit:false */
/* global describe:false */
/* global before:false */
/* global after:false */

'use strict';

require('chromedriver');

const execSync = require('child_process').execSync,
    expect = require('expect.js'),
    path = require('path'),
    superagent = require('superagent'),
    { Builder } = require('selenium-webdriver'),
    { Options } = require('selenium-webdriver/chrome');

describe('Application life cycle test', function () {
    this.timeout(0);

    const LOCATION = 'test';
    const BASIC_AUTH_USER = 'admin';
    const BASIC_AUTH_PASS = 'changeme123';
    const EXEC_ARGS = { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' };

    let browser, app;

    before(function () {
        browser = new Builder().forBrowser('chrome').setChromeOptions(new Options().windowSize({ width: 1280, height: 1024 })).build();
    });

    after(function () {
        browser.quit();
    });

    async function checkTwitterBridge() {
        const response = await superagent.get(`https://${app.fqdn}/?action=display&bridge=Reddit&context=single&r=cloudron&score=&format=Json`)
            .auth(BASIC_AUTH_USER, BASIC_AUTH_PASS);
        expect(response.status).to.eql(200);
        expect(response.body.home_page_url).to.eql('https://www.reddit.com');
    }

    function getAppInfo() {
        const inspect = JSON.parse(execSync('cloudron inspect'));
        app = inspect.apps.filter(function (a) { return a.location.startsWith(LOCATION); })[0];
        expect(app).to.be.an('object');
    }

    xit('build app', function () {
        execSync('cloudron build', EXEC_ARGS);
    });

    it('install app', function () {
        execSync('cloudron install --location ' + LOCATION, EXEC_ARGS);
    });

    it('can get app information', getAppInfo);

    it('can get the main page', async function () {
        const response = await superagent.get('https://' + app.fqdn).auth(BASIC_AUTH_USER, BASIC_AUTH_PASS);
        expect(response.status).to.eql(200);
    });

    it('can use the Twitter bridge', checkTwitterBridge);

    it('can restart app', function () {
        execSync('cloudron restart --app ' + app.id);
    });

    it('backup app', function () {
        execSync('cloudron backup create --app ' + app.id, EXEC_ARGS);
    });

    it('restore app', function () {
        const backups = JSON.parse(execSync(`cloudron backup list --app ${app.id} --raw`));
        execSync('cloudron uninstall --app ' + app.id, EXEC_ARGS);
        execSync('cloudron install --location ' + LOCATION, EXEC_ARGS);
        getAppInfo();
        execSync(`cloudron restore --backup ${backups[0].id} --app ${app.id}`, EXEC_ARGS);
    });

    it('can use the Twitter bridge', checkTwitterBridge);

    it('uninstall app', function () {
        execSync('cloudron uninstall --app ' + app.id, EXEC_ARGS);
    });

    // test update
    it('can install previous version from appstore', function () {
        execSync('cloudron install --appstore-id com.rssbridgeapp.cloudronapp --location ' + LOCATION, EXEC_ARGS);
        getAppInfo();
    });

    it('can use the Twitter bridge', checkTwitterBridge);

    it('can update', function () {
        execSync('cloudron update --app ' + LOCATION, EXEC_ARGS);
    });

    it('can use the Twitter bridge', checkTwitterBridge);

    it('uninstall app', function () {
        execSync('cloudron uninstall --app ' + app.id, EXEC_ARGS);
    });
});
