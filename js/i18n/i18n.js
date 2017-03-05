/**
 * @file 自制的多语言文本转换库
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/5
 * @module i18n
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(['cocos', 'i18n/localeList'], function (cc, localeList) {
    var localeContent = {};

    var curDictionary = {};

    var i18n = function (str) {
        if (curDictionary.hasOwnProperty(str)) {
            return curDictionary[str];
        } else {
            return str;
        }
    };

    i18n['defaultFont'] = cc.sys.isMobile ? 'Helvetica Neue' : 'Microsoft Yahei';

    i18n['getLanguageList'] = function () {
        return localeList;
    };

    i18n['setLanguage'] = function (localeName, callback) {
        localeName = localeName.toLowerCase();
        var shortLocaleName = localeName.substr(0, 2);
        var setLocale = function (locale) {
            localeContent = locale;
            curDictionary = locale['dictionary'];
            i18n['defaultFont'] = locale['defaultFont'];
            if (locale['defaultFontMobile'] && cc.sys.isMobile) {
                i18n['defaultFont'] = locale['defaultFontMobile'];
            }
            if (typeof callback === 'function') {
                callback();
            }
        };
        if (localeList[localeName]) {
            require(['../locale/' + localeName], setLocale);
        } else if (localeList[shortLocaleName]) {
            require(['../locale/' + shortLocaleName], setLocale);
        } else {
            return false;
        }
        return true;
    };

    var s = navigator.language;
    i18n.setLanguage(s);

    return i18n;
});
