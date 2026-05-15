// Photoshop 스크립트 — 모든 레이어 위치를 게임 좌표로 추출 (그룹 이름 포함)
// 사용법: Photoshop 메뉴 → File → Scripts → Browse → 이 파일 선택
//
// 결과: 바탕화면에 layer_positions.txt 저장됨

#target photoshop

(function () {
  if (!app.documents.length) {
    alert('열린 Photoshop 문서가 없습니다.');
    return;
  }

  var doc = app.activeDocument;
  var docW = doc.width.as('px');
  var docH = doc.height.as('px');

  // 게임 씬 좌표계 (1740 x 1080)
  var sceneW = 1740;
  var sceneH = 1080;
  var scaleX = sceneW / docW;
  var scaleY = sceneH / docH;

  var output = '=== Layer Positions (Game Coords ' + sceneW + 'x' + sceneH + ') ===\n';
  output += '// Photoshop 문서 크기: ' + Math.round(docW) + ' x ' + Math.round(docH) + '\n';
  output += '// 스케일: x*' + scaleX.toFixed(3) + ', y*' + scaleY.toFixed(3) + '\n\n';

  var layerData = [];

  function processLayer(layer, parentPath) {
    if (!layer.visible) return;

    // 현재 레이어의 전체 경로 (그룹 이름 포함)
    var currentPath = parentPath ? parentPath + '/' + layer.name : layer.name;

    if (layer.typename === 'LayerSet') {
      // 그룹은 자식만 재귀
      for (var i = 0; i < layer.layers.length; i++) {
        processLayer(layer.layers[i], currentPath);
      }
    } else if (layer.typename === 'ArtLayer') {
      try {
        var bounds = layer.bounds;
        var left = bounds[0].as('px');
        var top = bounds[1].as('px');
        var right = bounds[2].as('px');
        var bottom = bounds[3].as('px');
        var cx = Math.round(((left + right) / 2) * scaleX);
        var cy = Math.round(((top + bottom) / 2) * scaleY);
        var w = Math.round((right - left) * scaleX);
        var h = Math.round((bottom - top) * scaleY);

        layerData.push({
          path: currentPath,
          cx: cx,
          cy: cy,
          w: w,
          h: h,
        });
      } catch (e) {
        // 빈 레이어 무시
      }
    }
  }

  // 최상위 레이어부터 시작 (부모 경로는 빈 문자열)
  for (var i = 0; i < doc.layers.length; i++) {
    processLayer(doc.layers[i], '');
  }

  // 정렬 (경로 기준)
  layerData.sort(function (a, b) {
    return a.path.localeCompare(b.path);
  });

  for (var j = 0; j < layerData.length; j++) {
    var d = layerData[j];
    output += d.path + '\t' + d.cx + '\t' + d.cy + '\t' + d.w + '\t' + d.h + '\n';
  }

  output += '\n// 형식: 그룹/레이어이름  x  y  width  height';

  // 바탕화면에 저장
  var file = new File('~/Desktop/layer_positions.txt');
  file.encoding = 'UTF-8';
  file.open('w');
  file.write(output);
  file.close();

  alert(
    '✅ 레이어 위치 추출 완료!\n\n' +
      '파일 위치: 바탕화면/layer_positions.txt\n\n' +
      '총 ' +
      layerData.length +
      '개 레이어 추출됨'
  );
})();
