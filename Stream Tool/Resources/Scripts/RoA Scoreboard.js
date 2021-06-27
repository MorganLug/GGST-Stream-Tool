'use strict';

//animation stuff
const pMove = 50; //distance to move for the player names (pixels)
const pCharMove = 20; //distance to move for the character icons

const fadeInTime = .3; //(seconds)
const fadeOutTime = .2;

//max text sizes (used when resizing back)
const introSize = "85px";
const nameSize = "45px";
const scoreSize = "45px";
const tagSize = "30px";

const roundSize = "40px";

//to store the current character info
const pCharInfo = [];

//characters image file path
const charPath = "Resources/Characters/";

//color list will be stored here on startup
let colorList;

//to avoid the code constantly running the same method over and over
const pCharPrev = [], pSkinPrev = [], scorePrev = [], colorPrev = [], wlPrev = [];
let mainMenuPrev;

//to consider how many loops will we do
let maxPlayers = 2;
const maxSides = 2;

let startup = true;


//next, global variables for the html elements
const pWrapper = document.getElementsByClassName("wrappers");
const pTag = document.getElementsByClassName("tags");
const pName = document.getElementsByClassName("names");
const charImg = document.getElementsByClassName("pCharacter");
const colorImg = document.getElementsByClassName("colors");
const wlImg = document.getElementsByClassName("wlImg");
const scoreText = document.getElementsByClassName("scoreTexts");
const tLogoImg = document.getElementsByClassName("tLogos");
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
	const color = scInfo['color'];
	const score = scInfo['score'];
	const wl = scInfo['wl'];
	const gamemode = scInfo['gamemode'];

	const round = scInfo['round'];

	const mainMenu = scInfo['forceMM'];

	//first, things that will happen only once, when the html loads
	if (startup) {

		//first things first, initialize the colors list
		colorList = await getColorInfo();

		//this is on top of everything else because the await would desync the rest
		for (let i = 0; i < maxPlayers; i++) { //for each available player
			//gets us the character positions for the player
			pCharInfo[i] = await getCharInfo(player[i].character);
		}


		// now for the actual initialization of players
		for (let i = 0; i < maxPlayers; i++) {
			
			//lets start with the player names and tags
			updatePlayerName(i, player[i].name, player[i].tag, gamemode);
			//set the starting position for the player text, then fade in and move the text to the next keyframe
			if (gamemode == 1) { //if this is singles, fade the names in with a sick motion
				const movement = (i % 2 == 0) ? -pMove : pMove; //to know direction
				gsap.fromTo(pWrapper[i], 
					{x: movement}, //from
					{x: 0, opacity: 1, ease: "power2.out", duration: fadeInTime}); //to
			} else { //if doubles, just fade them in
				fadeIn(pWrapper[i], .15)
			}
			

			//set the character image for the player
			updateChar(player[i].character, player[i].skin, i, pCharInfo[i], mainMenu, startup);
			//when the image finishes loading, it will fade in (coded in updateChar())

			//save the character/skin so we run the character change code only when this doesnt equal to the next
			pCharPrev[i] = player[i].character;
			pSkinPrev[i] = player[i].skin;

		}

		// this will run for each side (so twice)
		for (let i = 0; i < maxSides; i++) {
			
			//if its grands, we need to show the [W] and/or the [L] on the players
			updateWL(wl[i], i, gamemode);
			if (gamemode == 1) {
				gsap.fromTo(wlImg[i], //if singles, move it vertically
					{y: -pMove}, //set starting position some pixels up (it will be covered by the overlay)
					{delay: .5, y: 0, ease: "power2.out", duration: .5}); //move down to its default position
			}
			//save for later so the animation doesn't repeat over and over
			wlPrev[i] = wl[i];

			//set the current score
			updateScore(score[i], i);
			const movement = (i % 2 == 0) ? -pMove : pMove; //to know direction
			gsap.fromTo(scoreText[i], 
				{x: movement}, //from
				{x: 0, opacity: 1, ease: "power2.out", duration: fadeInTime}); //to
			scorePrev[i] = score[i];

			//set the color
			updateColor(colorImg[i], color[i]);
			colorPrev[i] = color[i];

			//check if we have a logo we can place on the overlay
			if (gamemode == 1) { //if this is singles, check the player tag
				updateLogo(tLogoImg[i], player[i].tag, i, gamemode);
			}

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

		//get the character lists now before we do anything else
		for (let i = 0; i < maxPlayers; i++) {
			//if the character has changed, update the info
			if (pCharPrev[i] != player[i].character) {
				pCharInfo[i] = await getCharInfo(player[i].character);
			}
		}


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

			//player characters and skins
			if (pCharPrev[i] != player[i].character || pSkinPrev[i] != player[i].skin || mainMenuPrev != mainMenu) {

				//fade out the image while also moving it because that always looks cool
				fadeOutMove(charImg[i], -pCharMove, () => {
					//now that nobody can see it, lets change the image!
					updateChar(player[i].character, player[i].skin, i, pCharInfo[i], mainMenu);
					//will fade in when image finishes loading
				});
				pCharPrev[i] = player[i].character;
				pSkinPrev[i] = player[i].skin;
			}
		}


		//now let's check stuff from each side
		for (let i = 0; i < maxSides; i++) {
			
			//the [W] and [L] status for grand finals
			if (wlPrev[i] != wl[i]) {
				const movement = (i % 2 == 0) ? -pMove : pMove;
				//move it away!
				fadeOutWL(wlImg[i], movement, gamemode, () => {
					//change the thing!
					updateWL(wl[i], i, gamemode);
					//move it back!
					fadeInWL(wlImg[i], gamemode)
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

			//change the player background colors
			if (colorPrev[i] != color[i]) {
				updateColor(colorImg[i], color[i]);
				colorPrev[i] = color[i];
			}

			//check if we have a logo we can place on the overlay
			if (gamemode == 1) { //if this is singles, check the player tag
				if (pTag[i].textContent != player[i].tag) {
					fadeOut(tLogoImg[i], () => {
						updateLogo(tLogoImg[i], player[i].tag, i, gamemode);
						fadeIn(tLogoImg[i]);
					});
				}
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

function updateColor(colorEL, pColor) {
	gsap.to(colorEL, {fill: getHexColor(pColor), duration: fadeInTime});
}

function updateLogo(logoEL, nameLogo, side, gamemode) {
	const mode = gamemode==1 ? "Singles" : "Doubles";
	const actualSide = side ? "Right" : "Left";
	logoEL.src = 'Resources/Logos/' + mode + '/' + actualSide + '/' + nameLogo + '.png';
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
		wlImg[pNum].src = 'Resources/Overlay/Scoreboard/WLs/Winners P' + (pNum+1) + ' ' + gamemode + '.png';
	} else if (pWL == "L") {
		wlImg[pNum].src = 'Resources/Overlay/Scoreboard/WLs/Losers P' + (pNum+1) + ' ' + gamemode + '.png';
	} else if (pWL == "Nada") {
		wlImg[pNum].src = 'Literally nothing.png';
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

//fade in but for the character image
function fadeInChara(charaEL, charScale, startup) {
	if (startup) {
		gsap.fromTo(charaEL,
			{x: -pCharMove},
			{delay: .20, x: 0, opacity: 1, ease: "power2.out", duration: fadeInTime});
	} else {
		gsap.fromTo(charaEL,
			{scale: charScale}, //set scale keyframe so it doesnt scale while transitioning
			{delay: .2, x: 0, opacity: 1, ease: "power2.out", duration: fadeInTime}
		);
	}
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

//so we can get the exact color used by the game!
function getHexColor(color) {
	for (let i = 0; i < colorList.length; i++) {
		if (colorList[i].name == color) {
			return colorList[i].hex;
		}
	}
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

//searches for the colors list json file
function getColorInfo() {
	return new Promise(function (resolve) {
		const oReq = new XMLHttpRequest();
		oReq.addEventListener("load", reqListener);
		oReq.open("GET", 'Resources/Texts/Color Slots.json');
		oReq.send();

		function reqListener () {
			resolve(JSON.parse(oReq.responseText))
		}
	})
}

//searches for a json file with character data
function getCharInfo(pCharacter) {
	return new Promise(function (resolve) {
		const oReq = new XMLHttpRequest();
		oReq.addEventListener("load", reqListener);
		oReq.onerror = () => {resolve("notFound")}; //for obs local file browser sources
		oReq.open("GET", charPath + pCharacter + '/_Info.json');
		oReq.send();

		function reqListener () {
			try {resolve(JSON.parse(oReq.responseText))}
			catch {resolve("notFound")} //for live servers
		}
	})
}

//now the complicated "change character image" function!
function updateChar(pCharacter, pSkin, pNum, charInfo, mainMenu, startup = false) {

	//store so code looks cleaner
	const charEL = charImg[pNum];

	//change the image path depending on the character and skin
	charEL.src = charPath + pCharacter + '/' + pSkin + '.png';

	//             x, y, scale
	let charPos = [0, 0, 1];
	//now, check if the character and skin exist in the database down there
	if (charInfo != "notFound") {
		if (charInfo.scoreboard[pSkin]) { //if the skin has a specific position
			charPos[0] = charInfo.scoreboard[pSkin].x;
			charPos[1] = charInfo.scoreboard[pSkin].y;
			charPos[2] = charInfo.scoreboard[pSkin].scale;
		} else if (mainMenu && charInfo.scoreboard.mainMenu) { //for the main menu renders
			charPos[0] = charInfo.scoreboard.mainMenu.x;
			charPos[1] = charInfo.scoreboard.mainMenu.y;
			charPos[2] = charInfo.scoreboard.mainMenu.scale;
			charEL.src = charPath + pCharacter + '/MainMenu/'+pSkin+'.png';
		} else { //if none of the above, use a default position
			charPos[0] = charInfo.scoreboard.neutral.x;
			charPos[1] = charInfo.scoreboard.neutral.y;
			charPos[2] = charInfo.scoreboard.neutral.scale;
		}
	} else { //if the character isnt on the database, set positions for the "?" image
		//this condition is used just to position images well on both sides
		if (pNum % 2 == 0) {
			charPos[0] = 29;
		} else {
			charPos[0] = 15;
		}
		charPos[1] = -14;
		charPos[2] = 1.5;
	}
	
	//to position the character
	charEL.style.left = charPos[0] + "px";
	charEL.style.top = charPos[1] + "px";
	charEL.style.transform = "scale(" + charPos[2] + ")";


	//this will make the thing wait till the image is fully loaded
	charEL.decode().then(
		//when the image loads, fade it in
		fadeInChara(charImg[pNum], charPos[2], startup)
	).catch( () => {
		//if the image fails to load, we will use a placeholder
		charEL.src = charPathBase + 'Random/P'+((pNum%2)+1)+'.png';
		fadeInChara(charImg[pNum], charPos[2], startup);
	})

}
