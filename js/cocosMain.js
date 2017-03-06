/**
 * @file 用于学习cocos
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2016/12/20
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

require(['cocos', 'scenes/titleScene', 'benzAudioEngine'], function (cc, TitleScene, benzAudioEngine) {

    window.DEBUG_MODE = 1;

    cc.game.config = {
        "debugMode"     : DEBUG_MODE,
        "frameRate"     : 60,
        "showFPS"       : !!DEBUG_MODE,
        "id"            : "gameCanvas",
        "renderMode"    : 1
    };

    var RES = {
        titleScene: [
            'res/title.png',
        ]
    };

    var SOUND = {
        titleScene: [
            'res/selected.mp3',
            'res/hit-ball.mp3'
        ]
    };
    cc.game.onStart = function(){
        if (cc.sys.isMobile) {
            cc.view.setDesignResolutionSize(1080, 1920, cc.ResolutionPolicy.NO_BORDER);
        } else {
            cc.view.setDesignResolutionSize(1920, 1080, cc.ResolutionPolicy.SHOW_ALL);
        }
        cc.view.setOrientation(cc.ORIENTATION_PORTRAIT);
        cc.view.resizeWithBrowserSize(true);
        cc.LoaderScene.preload(RES.titleScene, function () {
            benzAudioEngine.load(SOUND.titleScene, function () {
                cc.director.runScene(new TitleScene());
            });
        }, this);
    };

    cc.game.run("gameCanvas");
    document.getElementById("gameCanvas").focus();

});
