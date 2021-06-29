'use strict';

//animation stuff
const pMove = 50; //distance to move for the player names (pixels)

const fadeInTime = .3; //(seconds)
const fadeOutTime = .2;

//max text sizes (used when resizing back)
const introSize = "85px";
const nameSize = "45px";
const scoreSize = "45px";
const tagSize = "30px";

const roundSize = "40px";

//to avoid the code constantly running the same method over and over
const scorePrev = [], wlPrev = [];
let mainMenuPrev;

//to consider how many loops will we do
let maxPlayers = 2;
const maxSides = 2;

let startup = true;


//next, global variables for the html elements
const pWrapper = document.getElementsByClassName("wrappers");
const pTag = document.getElementsByClassName("tags");
const pName = document.getElementsByClassName("names");
const wlImg = document.getElementsByClassName("wlImg");
const wlText = document.getElementsByClassName("wlText");
const scoreText = document.getElementsByClassName("scoreTexts");
const overlayRound = document.getElementById("overlayRound");
const textRound = document.getElementById('round');


/* script begin */
async function mainLoop() {
	const scInfo = await getInfo();
	getData(scInfo);
}
mainLoop();
setInterval( () => { mainLoop(); }, 500); //update interval

async function getData(scInfo) {

	const player = scInfo['player'];
	const score = scInfo['score'];
	const wl = scInfo['wl'];
	const gamemode = scInfo['gamemode'];

	const round = scInfo['round'];

	const mainMenu = scInfo['forceMM'];

	//first, things that will happen only once, when the html loads
	if (startup) {

		// now for the actual initialization of players
		for (let i = 0; i < maxPlayers; i++) {
			
			//lets start with the player names and tags
			updatePlayerName(i, player[i].name, player[i].tag, gamemode);
			//if its grands, we need to show the [W] and/or the [L] on the players
			updateWL(wl[i], i, gamemode);
			//save for later so the animation doesn't repeat over and over
			wlPrev[i] = wl[i];

			//set the starting position for the player text, then fade in and move the text to the next keyframe
			if (gamemode == 1) { //if this is singles, fade the names in with a sick motion
				const movement = (i % 2 == 0) ? -pMove : pMove; //to know direction
				gsap.fromTo(pWrapper[i], 
					{x: movement}, //from
					{x: 0, opacity: 1, ease: "power2.out", duration: fadeInTime}); //to
			} else { //if doubles, just fade them in
				fadeIn(pWrapper[i], .15)
			}
		}

		// this will run for each side (so twice)
		for (let i = 0; i < maxSides; i++) {

			//set the current score
			updateScore(score[i], i);
			const movement = (i % 2 == 0) ? -pMove : pMove; //to know direction
			gsap.fromTo(scoreText[i], 
				{x: movement}, //from
				{x: 0, opacity: 1, ease: "power2.out", duration: fadeInTime}); //to
			scorePrev[i] = score[i];
		
		}


		//update the round text	and fade it in
		updateText(textRound, round, roundSize);
		fadeIn(overlayRound, 0);

		//set this for later
		mainMenuPrev = mainMenu;


		startup = false; //next time we run this function, it will skip all we just did
	}

	//now things that will happen constantly
	else {

		//lets check each player
		for (let i = 0; i < maxPlayers; i++) {
			
			//player names and tags
			if (pName[i].textContent != player[i].name || pTag[i].textContent != player[i].tag) {

				//check the player's side so we know the direction of the movement
				const movement = (i % 2 == 0) ? -pMove : pMove;

				//if this is singles, move the texts while updating
				if (gamemode == 1) {
					//move and fade out the player 1's text
					fadeOutMove(pWrapper[i], movement, () => {
						//now that nobody is seeing it, quick, change the text's content!
						updatePlayerName(i, player[i].name, player[i].tag, gamemode);
						//fade the name back in with a sick movement
						fadeInMove(pWrapper[i]);
					});
				}
				
			}
		}


		//now let's check stuff from each side
		for (let i = 0; i < maxSides; i++) {
			
			//the [W] and [L] status for grand finals
			if (wlPrev[i] != wl[i]) {
				const movement = (i % 2 == 0) ? -pMove : pMove;
				//move it away!
				fadeOutMove(pWrapper[i], movement, () => {
					//change the thing!
					updateWL(wl[i], i, gamemode);
					//move it back!
					fadeInMove(pWrapper[i]);
				});
				wlPrev[i] = wl[i];
			}

			//score check
			if (scorePrev[i] != score[i]) {
				//check the player's side so we know the direction of the movement
				const movement = (i % 2 == 0) ? -pMove : pMove;

				fadeOutMove(scoreText[i], movement, () => {
					//now that nobody is seeing it, quick, change the text's content!
					updateScore(score[i], i); //if true, animation will pla
					//fade the name back in with a sick movement
					fadeInMove(scoreText[i]);
				});

				scorePrev[i] = score[i];
			}

		}


		//we place this one here so both characters can be updated in one go
		mainMenuPrev = mainMenu;

		
		//and finally, update the round text
		if (textRound.textContent != round){
			fadeOut(textRound, () => {
				updateText(textRound, round, roundSize);
				fadeIn(textRound);
			});
		}

	}
}


// update functions
function updateScore(pScore, pNum) {
	scoreText[pNum].style.fontSize = scoreSize;
	scoreText[pNum].textContent = parseInt(pScore);

}

function updatePlayerName(pNum, name, tag, gamemode) {
	pName[pNum].style.fontSize = nameSize;
	pTag[pNum].style.fontSize = tagSize;
	pName[pNum].textContent = name; //change the actual text
	pTag[pNum].textContent = tag;
	resizeText(pWrapper[pNum]); //resize if it overflows
}

//generic text changer
function updateText(textEL, textToType, maxSize) {
	textEL.style.fontSize = maxSize; //set original text size
	textEL.textContent = textToType; //change the actual text
	resizeText(textEL); //resize it if it overflows
}

function updateWL(pWL, pNum, gamemode) {
	//check if winning or losing in a GF, then change image
	if (pWL == "W") {
		wlText[pNum].textContent = "[W]";
	} else if (pWL == "L") {
		wlText[pNum].textContent = "[L]";
	} else if (pWL == "Nada") {
		wlText[pNum].textContent = "";
	}
}


//fade out
function fadeOut(itemID, funct) {
	gsap.to(itemID, {opacity: 0, duration: fadeOutTime, onComplete: funct});
}

//fade out but with movement
function fadeOutMove(itemID, move, funct) {
	gsap.to(itemID, {x: move, opacity: 0, ease: "power1.in", duration: fadeOutTime, onComplete: funct});
}

//fade in
function fadeIn(itemID, delayTime = .2) {
	gsap.to(itemID, {delay: delayTime, opacity: 1, duration: fadeInTime});
}

//fade in but with movement
function fadeInMove(itemID) {
	gsap.to(itemID, {delay: .3, x: 0, opacity: 1, ease: "power2.out", duration: fadeInTime});
}

//movement for the [W]/[L] images
function fadeOutWL(wlEL, move, gamemode, funct) {
	if (gamemode == 1) {
		gsap.to(wlEL, {y: move, ease: "power1.in", duration: .5, onComplete: funct});
	} else {
		gsap.to(wlEL, {x: move*3, ease: "power1.in", duration: .5, onComplete: funct});
	}
}
function fadeInWL(wlEL, gamemode) {
	if (gamemode == 1) {
		gsap.to(wlEL, {delay: .1, y: 0, ease: "power2.out", duration: .5});
	} else {
		gsap.to(wlEL, {delay: .1, x: 0, ease: "power2.out", duration: .5});
	}
}


//text resize, keeps making the text smaller until it fits
function resizeText(textEL) {
	const childrens = textEL.children;
	while (textEL.scrollWidth > textEL.offsetWidth || textEL.scrollHeight > textEL.offsetHeight) {
		if (childrens.length > 0) { //for tag+player texts
			Array.from(childrens).forEach(function (child) {
				child.style.fontSize = getFontSize(child);
			});
		} else {
			textEL.style.fontSize = getFontSize(textEL);
		}
	}
}

//returns a smaller fontSize for the given element
function getFontSize(textElement) {
	return (parseFloat(textElement.style.fontSize.slice(0, -2)) * .90) + 'px';
}

//searches for the main json file
function getInfo() {
	return new Promise(function (resolve) {
		const oReq = new XMLHttpRequest();
		oReq.addEventListener("load", reqListener);
		oReq.open("GET", 'Resources/Texts/ScoreboardInfo.json');
		oReq.send();

		//will trigger when file loads
		function reqListener () {
			resolve(JSON.parse(oReq.responseText))
		}
	})
	//i would gladly have used fetch, but OBS local files wont support that :(
}