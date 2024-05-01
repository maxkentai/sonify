// Data variable
let data;
let defaultTable = true;

// For automatically playing the song
let timer = setInterval(timerFunction, 1000);
clearInterval(timer);

let index = 0;
let trigger = 0;
let autoplay = false;
let recordReady = false;
let recording = false;

// set a total length of 30s  (30000 millis)
let total_length = 30000; // ms
let tLengthSlider;
let tick;

let input; // file input 

// data maxima for each column
let minimums = Array();
let maximums = Array();

// sonification params for each column
let minPitches = Array();
let maxPitches = Array();

let sampleNames = Array();
let minRates = Array();
let maxRates = Array();

let minVolumes = Array();
let maxVolumes = Array();

let glides = Array();
// let controlAmps = Array(); // true false -> data contols the amplitude

let oscillators = Array();
let sounds = Array(); // sample players

let gains = Array(); // gain after osci or soundplayer
let gainValues = Array(); // gain value / volume values after osci or soundplayer


let colIndex = 0; // selected column index
let displayPercentual = true; // true == min max of each column is 0 and height, false == min max of all columns is 0 and height
let displayPercentualToggle;

let xAxisDisplay = true;
let xAxisDisplayToggle;
let xAxisColumn = 0; // the column that is used as x axis

let yAxisDisplay = true;
let yAxisDisplayToggle;

let startButton;
let stopButton;
let recordButton;

let colButtons = Array();
let colors = Array();
let textfield;
let indexLabel;
let img;

let controlMenu;
let soniControls;

let osciControls;
let minPitchSlider;
let minPitchLabel;
let maxPitchSlider;
let maxPitchLabel;

let sampleControls;
let sampleNameLabel;
let minRateSlider;
let minRateLabel;
let maxRateSlider;
let maxRateLabel;

let commonControls;
let minVolumeSlider;
let minVolumeLabel;
let maxVolumeSlider;
let maxVolumeLabel;

let commonControls2;
let glideSlider;
let glideLabel;
let volumeSlider;
let volumeLabel;

let sound;
let soundInput;

let select;
let selectedSounds = Array();

// let controlAmpsCheckbox;

let recorder;
let soundFile;


function preload() {
  // sounds[0] = loadSound('data/spaces.mp3');
}



function setup() {
  // getAudioContext().suspend();

  createCanvas(windowWidth, windowHeight / 2);
  img = createImage(width, height);

  var url = 'data/trenet_data_toni.csv';


  data = loadTable(url, "ssv", "header", tableLoaded);
  frameRate(60);

  // console.log("0dB", dbToAmp(0));
  console.log(data);
}



// after table load
function tableLoaded() {

  masterVolume(1);
  // compute attributes of data for sonification
  // desired sonification length in ms / rows -> tick
  tick = total_length / data.getRowCount();
  // console.log("tick", tick);

  // setTimer(tick);

  // get min / max
  for (let i = 0; i < data.getColumnCount(); i++) {

    minimums[i] = min(data.getColumn(data.columns[i]));
    maximums[i] = max(data.getColumn(data.columns[i]));

    minVolumes[i] = -18;
    maxVolumes[i] = 0;

    gainValues[i] = 0;
    glides[i] = 10; // glide time in 1 / 100 sec

    // make random color
    colors[i] = color(100 + Math.random() * 155, 100 + Math.random() * 155, 100 + Math.random() * 155);

    // create oscis
    oscillators[i] = new p5.SinOsc();
    oscillators[i].amp(0);
    if (defaultTable) {
      sounds[i] = new loadSound('data/Spaces.mp3', function () {
        // console.log("space loaded");
      });
    } else {
      sounds[i] = new p5.SoundFile();
    }
    sounds[i].setLoop(true);
    sounds[i].setVolume(0);

    gains[i] = new p5.Gain();
    gains[i].amp(0);

    oscillators[i].disconnect();
    sounds[i].disconnect();
    oscillators[i].connect(gains[i]);
    sounds[i].connect(gains[i]);

    gains[i].connect(); // to master output

  }

  defaultTable = false;

  // make image to display from data
  drawData(data);

  // dom elements
  removeElements();
  // add dom elements
  createP("");
  createSpan("Open .csv File    ");
  input = createFileInput(handleFile);
  input.attribute('accept', '.csv');

  xAxisDisplayToggle = createCheckbox("X-Axis Display", xAxisDisplay).style('display', 'inline-block');
  xAxisDisplayToggle.input(function () {
    if (xAxisDisplayToggle.checked()) xAxisDisplay = true;
    else xAxisDisplay = false;
    drawData(data);
  });

  yAxisDisplayToggle = createCheckbox("Y-Axis Display", yAxisDisplay).style('display', 'inline-block');
  yAxisDisplayToggle.input(function () {
    if (yAxisDisplayToggle.checked()) yAxisDisplay = true;
    else yAxisDisplay = false;
    drawData(data);
  });

  displayPercentualToggle = createCheckbox("relative Y-Display", displayPercentual).style('display', 'inline-block');
  displayPercentualToggle.input(function () {
    if (displayPercentualToggle.checked()) displayPercentual = true;
    else displayPercentual = false;
    drawData(data);
  });

  createP("");
  createDiv(data.getRowCount() + '  Rows, ' + data.getColumnCount() + " Columns");
  createP("");
  createDiv("Select Column:");
  const colButtonContainer = createDiv().class('col-button-container');

  // make col buttons
  for (let i = 0; i < data.columns.length; i++) {
    colButtons[i] = createButton(data.columns[i]).parent(colButtonContainer);
    colButtons[i].id(i);

    if (!isNaN(minimums[i])) colButtons[i].style('background-color', colors[i].toString());

    minPitches[i] = 48;
    maxPitches[i] = 60;

    sampleNames[i] = 'Spaces.mp3';
    minRates[i] = 0.88;
    maxRates[i] = 1.07;

    gainValues[i] = -60;
    selectedSounds[i] = 'Sample';

    colButtons[i].mousePressed(function () {
      colIndex = this.id();
      updateTextfield();
      drawData(data);
      updateControls();
    });

  }

  document.getElementById("0").click(); // push first button to init


  textfield = createP("..<br>..<br>..");




  createP("");

  soniControls = createDiv().class('sonicontrols noselect');
  controlMenu = createDiv().parent(soniControls).class('control-menu');
  createSpan("Choose Sound Source ").parent(controlMenu);
  select = createSelect().parent(controlMenu);
  select.option('Sine');
  select.option('Sample');
  select.selected('Sample');
  select.changed(function () {
    selectedSounds[colIndex] = select.value();

    switchBetweenOsciSample();
  })


  createP("");

  // sample controls
  sampleControls = createDiv().size(240, 175).parent(soniControls);
  // createSpan("Open Audio File    ").parent(sampleControls);
  sampleNameLabel = createSpan("Spaces.mp3").parent(sampleControls);
  soundInput = createFileInput(handleFile).parent(sampleControls);
  soundInput.attribute('accept', 'audio/*');


  createSpan('Max Rate: ').parent(sampleControls);
  maxRateLabel = createSpan("1.07").parent(sampleControls);
  maxRateSlider = createSlider(0, 2, 1.07, 0.01).parent(sampleControls);
  maxRateSlider.style('display', 'block');
  maxRateSlider.input(function () {
    maxRates[colIndex] = maxRateSlider.value();
    maxRateLabel.html(maxRates[colIndex]);
  })

  createSpan('Min Rate: ').parent(sampleControls);
  minRateLabel = createSpan("0.88").parent(sampleControls);
  minRateSlider = createSlider(0, 2, 0.88, 0.01).parent(sampleControls);
  minRateSlider.style('display', 'block');
  minRateSlider.input(function () {
    minRates[colIndex] = minRateSlider.value();
    minRateLabel.html(minRates[colIndex]);
  })


  sampleControls.hide(); // init with osci


  // osci controls
  osciControls = createDiv().size(150, 175).parent(soniControls);

  createSpan('Max Pitch: ').parent(osciControls);
  maxPitchLabel = createSpan("60").parent(osciControls);
  maxPitchSlider = createSlider(0, 127, 60).parent(osciControls);
  maxPitchSlider.style('display', 'block');
  maxPitchSlider.input(function () {
    maxPitches[colIndex] = maxPitchSlider.value();
    maxPitchLabel.html(maxPitches[colIndex]);
  })

  createSpan('Min Pitch: ').parent(osciControls);
  minPitchLabel = createSpan("48").parent(osciControls);
  minPitchSlider = createSlider(0, 127, 48).parent(osciControls);
  minPitchSlider.style('display', 'block');
  minPitchSlider.input(function () {
    minPitches[colIndex] = minPitchSlider.value();
    minPitchLabel.html(minPitches[colIndex]);
  })


  // common Controls
  commonControls = createDiv().size(150, 175).parent(soniControls).class('common-controls');
  createSpan('Max Volume: ').parent(commonControls);
  maxVolumeLabel = createSpan("0dB").parent(commonControls);
  maxVolumeSlider = createSlider(-60, 0, 0).parent(commonControls);
  maxVolumeSlider.style('display', 'block');
  maxVolumeSlider.input(function () {
    maxVolumes[colIndex] = maxVolumeSlider.value();
    maxVolumeLabel.html(maxVolumes[colIndex] + "dB");
  })

  createSpan('Min Volume: ').parent(commonControls);
  minVolumeLabel = createSpan("-18dB").parent(commonControls);
  minVolumeSlider = createSlider(-60, 0, -18).parent(commonControls);
  minVolumeSlider.style('display', 'block');
  minVolumeSlider.input(function () {
    minVolumes[colIndex] = minVolumeSlider.value();
    minVolumeLabel.html(minVolumes[colIndex] + "dB");
  })

  commonControls2 = createDiv().size(150, 175).parent(soniControls).class('common-controls');
  createSpan('Smoothing: ').parent(commonControls2);
  glideLabel = createSpan("0.1s").parent(commonControls2);
  glideSlider = createSlider(0, 100, 1).parent(commonControls2);
  glideSlider.style('display', 'block');
  glideSlider.input(function () {
    glides[colIndex] = glideSlider.value();
    glideLabel.html(glides[colIndex] / 100 + "s");
  })

  createSpan('Total Volume: ').parent(commonControls2);
  volumeLabel = createSpan("-60dB").parent(commonControls2);
  volumeSlider = createSlider(-60, 0, -60).parent(commonControls2);
  volumeSlider.style('display', 'block');
  volumeSlider.input(function () {
    gainValues[colIndex] = volumeSlider.value();
    volumeLabel.html(gainValues[colIndex] + "dB");
    gains[colIndex].amp(dbToAmp(gainValues[colIndex]), 0.2);
  })


  // controlAmpsCheckbox = createCheckbox('Data Values to Amplitude', false);
  // controlAmpsCheckbox.parent(commonControls2);
  // controlAmpsCheckbox.changed(function () {
  //   if (controlAmpsCheckbox.checked()) controlAmps[colIndex] = true;
  //   else controlAmps[colIndex] = false;
  // });


  createP("");

  indexLabel = createDiv('Row Index: ' + index);

  // transport controls
  playButton = createButton("Play").class('play-button');
  playButton.mousePressed(play);
  stopButton = createButton("Stop").class('stop-button stopped');
  stopButton.mousePressed(stop);
  recordButton = createButton("Record").class('record-button');
  recordButton.mousePressed(record);


  createP("");

  createSpan("Total Length (ms): ");
  tLengthSlider = createInput("3000", 'number');
  tLengthSlider.input(function () {
    // console.log("ok", tLengthSlider.value());
    let inTime = parseInt(tLengthSlider.value());
    if (!isNaN(inTime)) {
      total_length = inTime;
      tick = total_length / data.getRowCount();
      // setTimer(tick);
    }
  });

  createP("");




  recorder = new p5.SoundRecorder();

  // // connect all the sound sources to the recorder
  for (let i = 0; i < data.getColumnCount(); i++) {

    if (!isNaN(minimums[i])) {
      gains[i].connect(recorder);
    }
  }

  // this sound file will be used to
  // playback & save the recording
  soundFile = new p5.SoundFile();

  createP("");

  updateTextfield();
  updateControls();

}

function updateTextfield() {
  textfield.html(isNaN(minimums[colIndex]) ? 'not a number!' :
    "Data Minimum: " + minimums[colIndex] + " Data Maximum: " + (isNaN(maximums[colIndex]) ? 'not a number' : maximums[colIndex]) + '<br>'
  );

}

// when selecting columns with col buttons
function updateControls() {
  soniControls.style('background-color', colors[colIndex].toString());

  // update controls
  if (isNaN(minimums[colIndex])) {
    soniControls.style('visibility', 'hidden');
    soniControls.style('pointer-events', 'none');
  } else {
    soniControls.style('visibility', 'visible');
    soniControls.style('pointer-events', 'auto');

    select.value(selectedSounds[colIndex]);
    switchBetweenOsciSample();

    minPitchSlider.value(minPitches[colIndex]);
    minPitchLabel.html(minPitches[colIndex]);
    maxPitchSlider.value(maxPitches[colIndex]);
    maxPitchLabel.html(maxPitches[colIndex]);

    sampleNameLabel.html(sampleNames[colIndex]);
    minRateSlider.value(minRates[colIndex]);
    minRateLabel.html(minRates[colIndex]);
    maxRateSlider.value(maxRates[colIndex]);
    maxRateLabel.html(maxRates[colIndex]);

    minVolumeSlider.value(minVolumes[colIndex]);
    minVolumeLabel.html(minVolumes[colIndex] + "dB");
    maxVolumeSlider.value(maxVolumes[colIndex]);
    maxVolumeLabel.html(maxVolumes[colIndex] + "dB");

    glideSlider.value(glides[colIndex]);
    glideLabel.html(glides[colIndex] / 100 + "s");

    volumeSlider.value(gainValues[colIndex]);
    volumeLabel.html(gainValues[colIndex] + "dB");

    // controlAmpsCheckbox.checked(controlAmps[colIndex]);
  }

}

function switchBetweenOsciSample() {

  if (select.value() == 'Sine') {
    osciControls.show();
    sampleControls.hide();

    if (autoplay) {
      oscillators[colIndex].start();
      // oscillators[colIndex].amp(0); // amp is controlled by data values

      sounds[colIndex].setVolume(0, 0.2);
    }

  } else {
    // Mute the Osci
    oscillators[colIndex].amp(0, 0.2);

    if (autoplay) {
      if (!sounds[colIndex].isPlaying()) try {
        sounds[colIndex].loop();
      } catch {

      }
      // sounds[colIndex].setVolume(0); // amp is controlled by data values
    }



    osciControls.hide();
    sampleControls.show();
  }

}

function play() {
  userStartAudio();

  autoplay = true;
  // setTimer(tick);

  if (recordButton.hasClass('record-ready')) {
    record();
  }
  playButton.addClass('playing');
  stopButton.removeClass('stopped');

  for (let i = 0; i < data.getColumnCount(); i++) {

    if (!isNaN(minimums[i])) {

      if (selectedSounds[i] == 'Sine') {
        oscillators[i].start();

        oscillators[i].amp(0); // amp is controlled by data values

      } else if (selectedSounds[i] == 'Sample') {
        try {
          sounds[i].loop();
        } catch {
          // console.log("nogood");
        }
        sounds[i].setVolume(0); // amp is controlled by data values
      }
    }
  }
}

function stop() {

  // stopTimer();

  if (autoplay) { // stop but no reset
    autoplay = false;
  } else { // 2nd time do reset
    index = 0;
    indexLabel.html('Row Index: ' + index);
  }

  stopSound();
  stopButton.addClass('stopped');
  playButton.removeClass('playing');

  if (recording) {
    recorder.stop();
    recording = false;
    recordButton.removeClass('recording')

    setTimeout(function () {
      let hr = hour();
      if (hr == '0') hr = "00";
      let mn = minute();
      if (mn == '0') mn = "00";

      save(soundFile, 'Sonify-' + year() + month() + day() + "_" + hr + mn + '.wav');
    }, 500);
  } else if (recordReady) {
    recordReady = false;
    recordButton.removeClass('record-ready')
  }

}


function record() {
  if (autoplay) {
    recordButton.removeClass('record-ready');
    recordButton.addClass('recording');

    recorder.record(soundFile);
    recording = true;

  } else {
    recordReady = true;
    recordButton.addClass('record-ready');
  }
}


function handleFile(file) {
  // print(file);

  stop();

  if (file.type === 'text' && (file.subtype === 'csv' || file.subtype === 'ssv')) {

    // console.log(file.data);
    let subtype = file.subtype;
    console.log("subtype", subtype);

    // create temp url
    var blobURL = URL.createObjectURL(file.file);

    let strings = loadStrings(blobURL, function (result) {
      if (result[0].includes(";")) subtype = 'ssv'; // ; separated values
      else if (result[0].includes(",")) subtype = 'csv';
      console.log("loadstrings subtype", subtype);

      data = loadTable(blobURL, subtype, "header", tableLoaded);

    })


  } else if (file.type == 'audio') {
    // console.log(file.name);
    sampleNameLabel.html(file.name);
    sampleNames[colIndex] = file.name;
    var blobURL = URL.createObjectURL(file.file);
    sounds[colIndex] = loadSound(blobURL, function () {
      sounds[colIndex].disconnect();
      sounds[colIndex].connect(gains[colIndex]);

    });
  }
}



function drawData(data) {

  let xpos = 0;
  let y = 0;

  let minAll = Number.POSITIVE_INFINITY;
  let maxAll = Number.NEGATIVE_INFINITY;

  let mini = 0;
  let maxi = 0;

  let label = "";

  if (!displayPercentual) {
    // get min max of all datasets
    for (let i = 0; i < data.columns.length; i++) {
      if (minimums[i] < minAll) minAll = minimums[i];
      if (maximums[i] > maxAll) maxAll = maximums[i];
    }
  }

  mini = minAll;
  maxi = maxAll;

  background(0);

  // loop through all columns == different datasets
  for (let i = 0; i < data.columns.length; i++) {

    stroke(colors[i]); // get the random color

    if (displayPercentual) { // take column specific min max
      mini = minimums[i];
      maxi = maximums[i];
    }

    // draw only columns width numbers 
    if (!isNaN(mini) && !isNaN(maxi)) {

      // loop through all rows of current column
      for (let j = 0; j < data.getRowCount(); j++) {

        // draw data
        xpos = map(j, 0, data.getRowCount(), 0, width);

        y = data.get(j, data.columns[i]);
        y = parseFloat(y);

        if (!isNaN(y)) {
          if (i == colIndex) {
            ellipse(xpos, map(y, mini, maxi, height, 0), 6, 6);
          } else {
            ellipse(xpos, map(y, mini, maxi, height, 0), 2, 2);
            // point(xpos, map(y, mini, maxi, height, 0));
          }
        }
      }

    }

    if (xAxisDisplay && i == xAxisColumn) {
      angleMode(DEGREES);
      // text for x - axis
      noStroke();
      fill(255);
      let mod = Math.round(50 / (width / data.getRowCount()));

      for (let j = 0; j < data.getRowCount(); j++) {

        if (j % mod == 0) {
          // draw data
          xpos = map(j, 0, data.getRowCount(), 0, width);

          label = data.get(j, data.columns[i]);

          // line(xpos, 0, xpos, height);
          push();
          translate(xpos, height);
          rotate(-90);
          text(label, 4, 9);
          pop();
        }
      }

    }
  }

  if (yAxisDisplay) {

    noStroke();
    fill(255);

    let mod = Math.round(height / 25);

    for (let i = 0; i < height; i++) {

      if (i % mod == 0) {
        const perc = 100 - (100 * i / height);
        if (displayPercentual) {
          text(Math.round(perc) + "%", 0, i);
        } else {
          text(map(perc, 0, 100, minAll, maxAll).toFixed(2), 0, i);
        }

      }
    }
  }

  img = get(); // grab canvas as an image

}




function draw() {

  background(0);
  image(img, 0, 0);

  stroke(255);
  let xpos = map(index, 0, data.getRowCount(), 0, width);
  line(xpos, 0, xpos, height);

  // indexLabel.html('Row Index: ' + index);


  // If we are autoplaying and it's time for the next note
  if (autoplay && (millis() > trigger)) {

    for (let i = 0; i < data.getColumnCount(); i++) {

      // play only number columns and sonifyOn cols
      if (!isNaN(minimums[i])) {

        const dataVal = data.get(min(index, data.getRowCount()), data.columns[i]);

        if (selectedSounds[i] == 'Sine') {

          playNote(dataVal, glides[i] / 100, oscillators[i], minimums[i], maximums[i], minPitches[i], maxPitches[i]);

          const db = map(dataVal, minimums[i], maximums[i], minVolumes[i], maxVolumes[i]);
          oscillators[i].amp(dbToAmp(db), glides[i] / 100);

        } else if (selectedSounds[i] == 'Sample') {

          sounds[i].rate(map(dataVal, minimums[i], maximums[i], minRates[i], maxRates[i]));

          const db = map(dataVal, minimums[i], maximums[i], minVolumes[i], maxVolumes[i]);
          sounds[i].setVolume(dbToAmp(db), glides[i] / 100);

        }
      }

    }

    trigger = millis() + tick;
    indexLabel.html('Row Index: ' + index);

    // Move to the next note
    index++;

    // We're at the end, stop autoplaying.
    if (index >= data.getRowCount() - 1) {
      autoplay = false;
      stop();
    }
  }

}

function setTimer(interval) {
  clearInterval(timer);
  timer = setInterval(timerFunction, interval);
}

function stopTimer(interval) {
  clearInterval(timer);
}

function timerFunction() {

  // If we are autoplaying and it's time for the next note
  if (autoplay) {

    for (let i = 0; i < data.getColumnCount(); i++) {

      // play only number columns 
      if (!isNaN(minimums[i])) {

        const dataVal = data.get(min(index, data.getRowCount()), data.columns[i]);

        if (selectedSounds[i] == 'Sine') {

          playNote(dataVal, glides[i] / 100, oscillators[i], minimums[i], maximums[i], minPitches[i], maxPitches[i]);

          const db = map(dataVal, minimums[i], maximums[i], minVolumes[i], maxVolumes[i]);
          oscillators[i].amp(dbToAmp(db), glides[i] / 100);

          // Fade out
          // setTimeout(function () {
          //   oscillators[i].fade(0, glides[i] / 100);
          // }, glides[i] / 100);


        } else if (selectedSounds[i] == 'Sample') {

          sounds[i].rate(map(dataVal, minimums[i], maximums[i], minRates[i], maxRates[i]));

          const db = map(dataVal, minimums[i], maximums[i], minVolumes[i], maxVolumes[i]);
          sounds[i].setVolume(dbToAmp(db), glides[i] / 100);

        }
      }

    }

    // Move to the next note
    index++;

    // We're at the end, stop autoplaying.
    if (index >= data.getRowCount() - 1) {
      autoplay = false;
      stop();
    }
  }

}

function dbToAmp(db) {
  const amp = Math.pow(10, db / 20);
  return amp;
}

function updateTransportState() {

}

function stopSound() {

  for (let i = 0; i < data.getColumnCount(); i++) {

    if (!isNaN(minimums[i])) {
      oscillators[i].amp(0, 0.2);
      sounds[i].stop();
    }
  }

  setTimeout(function () {

    for (let i = 0; i < data.getColumnCount(); i++) {

      if (!isNaN(minimums[i])) {
        oscillators[i].stop();
      }

    }

  }, 250);

}


// A function to play a note
function playNote(dataVal, glide, osc, min, max, lower, upper) {

  const pitch = map(dataVal, min, max, lower, upper);

  osc.freq(midiToFreq(pitch), glide);

}

function mousePressed() {
  mouseToIndex();
}

function mouseDragged() {
  mouseToIndex();
}

function mouseToIndex() {
  if (mouseY < height) {
    index = constrain(Math.floor(mouseX * data.getRowCount() / width), 0, data.getRowCount() - 1);
    indexLabel.html('Row Index: ' + index);
  }
}

function keyPressed(e) {
  if (e.code === 'Space') {
    if (autoplay) stop();
    else play();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight / 2);
  if (data) drawData(data);
}