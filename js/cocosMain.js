/**
 * @file 用于学习cocos
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2016/12/20
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

require(['cocos', 'scenes/gameScene', 'benzAudioEngine'], function (cc, GameScene, benzAudioEngine) {

    window.DEBUG_MODE = 1;

    cc.game.config = {
        "debugMode"     : DEBUG_MODE,
        "frameRate"     : 60,
        "showFPS"       : !!DEBUG_MODE,
        "id"            : "gameCanvas",
        "renderMode"    : 1
    };

    var RES = {
        gameScene: [
            'res/masterball.png',
            'res/ball-animate-sprite.png',
            'res/table.png',
            'res/fingers.png',

            'res/slider-background.png',
            'res/slider-progress.png',
            'res/slider-thumb.png',

            'res/btn-menu.png',

            'res/btn-force.png',
            'res/btn-force-disabled.png',

            'res/btn-shoot.png',
            'res/btn-shoot-disabled.png'
        ]
    };

    var SOUND = {
        gameScene: [
            'res/goal.mp3',
            'res/hit-ball.mp3',
            'res/hit-wall.mp3',
            'res/lost-master.mp3',
            'res/shoot.mp3',
            'res/bgm.mp3',
            'res/clear.mp3'
        ]
    };

    cc.game.onStart = function(){
        if (cc.sys.isMobile) {
            cc.view.setDesignResolutionSize(1080, 1920, cc.ResolutionPolicy.NO_BORDER);
        } else {
            cc.view.setDesignResolutionSize(1502, 877, cc.ResolutionPolicy.SHOW_ALL);
        }
        cc.view.setOrientation(cc.ORIENTATION_PORTRAIT);
        cc.view.resizeWithBrowserSize(true);
        cc.LoaderScene.preload(RES.gameScene, function () {
            benzAudioEngine.load(SOUND.gameScene, function () {
                cc.director.runScene(new GameScene());
            });
        }, this);
    };

    cc.game.run("gameCanvas");
    document.getElementById("gameCanvas").focus();

});
