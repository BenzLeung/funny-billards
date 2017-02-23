/**
 * @file RequireJS 的初始化配置
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/3
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

require.config({
    baseUrl: 'js',
    paths: {
        cocos: '../lib/cocos2d-js-v3.13-custom',
        ccui: '../lib/cocos2d-ccui',
        chipmunk: '../lib/chipmunk'
    },
    shim: {
        cocos: {
            exports: 'cc'
        },
        ccui: {
            deps: ['cocos'],
            exports: 'ccui'
        },
        chipmunk: {
            exports: 'cp'
        }
    }
});

require(['cocosMain']);