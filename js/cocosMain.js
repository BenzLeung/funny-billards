/**
 * @file 用于学习cocos
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2016/12/20
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

require(['cocos', 'scenes/gameScene'], function (cc, GameScene) {

    cc.game.config = {
        "debugMode"     : 1,
        "frameRate"     : 60,
        "showFPS"       : true,
        "id"            : "gameCanvas",
        "renderMode"    : 1
    };

    var RES = {
        gameScene: [
            'ball.png',
            'masterball.png',

            'slider-background.png',
            'slider-progress.png',
            'slider-thumb.png',

            'btn-menu.png',

            'btn-force.png',
            'btn-force-disabled.png',

            'btn-shoot.png',
            'btn-shoot-disabled.png'
        ]
    };

    for (var i in RES) {
        for (var j = 0, len = RES[i].length; j < len; j ++) {
            RES[i][j] = 'res/' + RES[i][j];
        }
    }

    cc.game.onStart = function(){
        if (cc.sys.isMobile) {
            cc.view.setDesignResolutionSize(1080, 1920, cc.ResolutionPolicy.NO_BORDER);
        } else {
            cc.view.setDesignResolutionSize(1502, 877, cc.ResolutionPolicy.SHOW_ALL);
        }
        cc.view.setOrientation(cc.ORIENTATION_PORTRAIT);
        cc.view.resizeWithBrowserSize(true);
        cc.LoaderScene.preload(RES.gameScene, function () {
            cc.director.runScene(new GameScene());
        }, this);
    };

    cc.game.run("gameCanvas");
    document.getElementById("gameCanvas").focus();

});
