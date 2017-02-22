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
        "renderMode"    : 0
    };

    cc.game.onStart = function(){
        if (cc.sys.isMobile) {
            cc.view.setDesignResolutionSize(877, 1642, cc.ResolutionPolicy.SHOW_ALL);
        } else {
            cc.view.setDesignResolutionSize(1502, 877, cc.ResolutionPolicy.SHOW_ALL);
        }
        cc.view.setOrientation(cc.ORIENTATION_PORTRAIT);
        cc.view.resizeWithBrowserSize(true);
        cc.LoaderScene.preload(['res/ball.png', 'res/masterball.png'], function () {
            cc.director.runScene(new GameScene());
        }, this);
    };

    cc.game.run("gameCanvas");
    document.getElementById("gameCanvas").focus();

});
