var matrix = [];
var prevFrame = 0;
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("recordButton").addEventListener("click", function() {
    if (typeof Leap != "undefined") {
      this.style.display = "none";
      startRecording();
    } else {
      displayLeapError();
    }
  });
});
function getFingerName(fingerType) {
  switch(fingerType) {
    case 0:
      return 'Thumb';
    break;

    case 1:
      return 'Index';
    break;

    case 2:
      return 'Middle';
    break;

    case 3:
      return 'Ring';
    break;

    case 4:
      return 'Pinky';
    break;
  }
}
function getFingerVar(id) {
  switch(id) {
    case 0:
      return "_x_";
    break;
    case 1:
      return "_y_";
    break;
    case 2:
      return "_z_";
    break;
  }
}
function startRecording() {
  setupTest();
  console.log("starting recording");
  matrix = initializeMatrix(matrix);
  // asychronous call to Leap will process data at end

  var my_controller = new Leap.Controller({enableGestures: true});
  var frame;
  my_controller.on("connect", function() {
    var interval = setInterval(function() {
      poll(my_controller.frame());
    }, 10);
    setTimeout(function() {
      clearInterval(interval);
      my_controller.disconnect();
      constructCSV();
    }, 10000);
  });
  my_controller.connect();
}
function initializeMatrix(matrix) {
  matrix.push(["frameId"],["timestamp"],["num_hands"],["num_fingers"]);
  handPrefix = "rh_"
  for (var i=0; i<2; i++) {
    matrix.push([handPrefix + "confidence"],[handPrefix + "pinch_st"],[handPrefix + "grab_st"]);
    for (var k = 0; k < 5; k++) {
      fingerPrefix = getFingerName(k).toLowerCase();
      for (var j = 0; j < 3; j++) {
        matrix.push([handPrefix + fingerPrefix + getFingerVar(j) + "dip"]);
      }
      for (var j = 0; j < 3; j++) {
        matrix.push([handPrefix + fingerPrefix + getFingerVar(j) + "pip"]);
      }
      for (var j = 0; j < 3; j++) {
       matrix.push([handPrefix + fingerPrefix + getFingerVar(j) + "mcp"]);
      }
    }
    handPrefix = "lh_";
  }
  return matrix;
}
function constructCSV() {
  var y = matrix.length;
  var x = matrix[0].length;
  var csv = "";
  for (var i = 0; i < x; i++){
    for (var j = 0; j < y-1; j++){
      if (matrix[j][i] != undefined){
        csv = csv.concat(matrix[j][i], ",");
      } else {
        csv = csv.concat("-", ",");
      }
    }
    if (matrix[y-1][i] != undefined){
        csv = csv.concat(matrix[y-1][i], "\n");
      } else {
        csv = csv.concat("-", "\n");
      }
  }
  var csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);
  document.getElementById("downloadButton").href = csvData;
  document.getElementById("downloadButton").style.display = "block"
}
function poll(frame) {
  if (prevFrame == frame.id) { return; }
  prevFrame = frame.id;
  if (frame.hands.length == 3) { return; }
  matrix[0].push(frame.id);
  matrix[1].push(frame.timestamp);
  matrix[2].push(frame.hands.length);
  matrix[3].push(frame.fingers.length);
  if (frame.hands.length == 0) {
    for (var i = 4; i < matrix.length; i++){
      console.log("pushing right and left empty items");
      matrix[i].push(undefined);
    }
  } else if (frame.hands.length == 1) {
    singleHand = true;
  } else {
    singleHand = false;
  }
  for (var i=0; i < frame.hands.length; i++) {
    hand = frame.hands[i];
    switch (hand.type){
      case "left":
      // push contents of frame into array from matrix[51] - matrix[98]
        startIndex = 52;
        break;
      case "right":
      // push contents of frame into array from matrix[3] - matrix[51]
        startIndex = 4;
    }
    populateMatrixData(hand, startIndex, singleHand);
  }
  function populateMatrixData(hand, index) {
    midpoint = (matrix.length-4)/2 + 4;
    if (singleHand) {
      if (hand.type == "left") {
        for (var i = 4; i < midpoint; i++){
          console.log("pushing right empty item");
          matrix[i].push(undefined);
        }
      } else {
        for (var i = midpoint; i < matrix.length; i++){
          console.log("pushing left empty item");
          matrix[i].push(undefined);
        }
      }
    }
    matrix[index].push(hand.confidence);
    matrix[index+1].push(hand.pinchStrength);
    matrix[index+2].push(hand.grabStrength);
    for (var k=0; k < hand.fingers.length; k++) {
      finger = hand.fingers[k];
      // used to shift index in matrix
      fingerType = finger.type;
      var l = 0;
      for (l; l < 3; l++) {
        matrix[index+3 + 9*fingerType + l].push(finger.dipPosition[l]);
      }
      for (l; l < 6; l++) {
        matrix[index+3 + 9*fingerType + l].push(finger.pipPosition[l%3]);
      }
      for (l; l < 9; l++) {
        matrix[index+3 + 9*fingerType + l].push(finger.mcpPosition[l%3]);
      }
    }
  }
}
function setupTest() {
  document.getElementById("testBox").style.display = 'block';
  document.getElementById("countdown").style.display = 'block';
  var i = 10;
  setInterval(function() {
    i--;
    document.getElementById("countdownNum").innerHTML = i;
    if (i == 0) {
      clearInterval();
      document.getElementById("testBox").style.display = 'none';
      document.getElementById("countdown").style.display = 'none';
    }
  },1000);
}
function displayLeapError() {
  document.getElementById("errorMessage").style.display = 'block';
  document.getElementById("errorCover").style.display = 'block';
  setTimeout(function() {
    document.getElementById("errorMessage").style.display = 'none';
    document.getElementById("errorCover").style.display = 'none';
  }, 4000);
}