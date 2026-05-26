// chokidar 기본 ignored 패턴 /(^|[\/\\])\../ 이 .git 경로를 무시함
// 이 프로젝트가 c:\Users\93827\.git\ 안에 있어서 파일 변경 감지가 안 됨
// chokidar가 로드되기 전에 이 스크립트로 watch 함수를 패치해서 해결
const chokidar = require('chokidar');
const origWatch = chokidar.watch;
chokidar.watch = function (paths, options) {
  return origWatch.call(this, paths, { ...options, ignored: /node_modules/ });
};
