
// fis配置文件
var CONFIG = '../config/';

function loadConfig(conf){
	require(CONFIG + conf);
}

loadConfig('config.js');
loadConfig('path.js');
loadConfig('deploy.js');

fis.config.merge({
    namespace: 'common'
});