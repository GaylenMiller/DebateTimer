// Shorthand for $( document ).ready()
$(function() {

    // Get the last word of the title.
    var title = $("title").text().toLowerCase();
    var parts = title.split(' ');
    title = parts[ parts.length-1];
    console.log( "ready! " + title);

    // branch to the case based on the lower case last word of the title attribute.
    switch(title) {

    // If this is the first page to pick the style, LD or TP.    
    case 'style':
        break;

    // If this is the second page to enter the speaker names.
    case 'speakers':
        var debateStyle = GetURLParam("style");
        if ( debateStyle === "LD") {
            $(".style-tp").hide();
            $(".style-ld").show();
        } else {
            $(".style.ld").hide();
            $(".style-tp").show();
        }

        // Save the style value.
        localStorage.setItem("style", debateStyle);


        // Set the event handling for the next "button" on the speakers form.
        var speakerForm = $("#speakers-form");
        if (speakerForm.length > 0) {
            // console.log("speaker form found");
            $('#button-next').click( function() {
                // console.log("form submit");
                speakerForm.submit();
            });
        }

        break;

    // If this is the third page, the timer.
    case 'timer':

        // Get the style value.
        var getDebateStyle = localStorage.getItem("style");


        // Save the speakers in an associative array.
        globalSpeakers = {};
        globalSpeakers['1A'] =  GetURLParam("1A") || "Aff 1";
        globalSpeakers['2A'] =  GetURLParam("2A") || "Aff 2";
        globalSpeakers['1N'] =  GetURLParam("1N") || "Neg 1";
        globalSpeakers['2N'] =  GetURLParam("2N") || "Neg 2";

        // Remove the speaker table that will not be used.
        if (getDebateStyle === 'LD') {
            $("#tp-speech-speaker-table").remove();
        } else {
            $("#ld-speech-speaker-table").remove();
        }

        // Setup the speech.
        setupSpeech();

        // Set the event handlers.
        $("#start-stop-button").click( startStopClick );
        $("#timer-container").click( startStopClick );

        // Set the event handlers for the previous and next buttons.
        $("#next-speech-button").click( nextSpeechClick );
        $("#prev-speech-button").click( prevSpeechClick );

        // $("#down-arrow").hide();
        $("#down-arrow").click( upDownArrowClick );
        $("#up-arrow").click( upDownArrowClick );

        // Catch the before unload event.
        window.onbeforeunload = leavingPageWarning;
    }



});

// Globals ---------------------------------------------------------
var globalSpeechTimeString; // starting minutes for this speech. Ex. "8:00".
var globalStopSeconds; // The stop time in seconds
// 


// Buttons -----------------------------------------------------------


function startStopClick() {

    // If this is a start button, change the text to stop and start the timer.
    var button = $("#start-stop-button");
    if (button.text() == "Start") {
        button.text("Stop");
        startTimer();

    // If this is a sto button, change text back to start and stop the timer.
    } else {
        button.text("Start");
        stopTimer();
    }

    // Toggle the class to toggle the color.
    button.toggleClass("start stop");
}


// The next button has just been clicked.
function nextSpeechClick() {

    // Make sure the timer is stopped.
    if ( timerRunning()) {
        startStopClick( $("start-stop-button"));
    }

    // If there is a current row.
    var row = $(".current");
    if (row.length) {

        // Check and see if this is a prep time row.
        var speaker = currentSpeaker();
        if (speaker.substr(0,1) == "P") {
            // Get the minutes used from the grid and calculate the remaining
            // time this way in cases when no prep time is used..
            var minutesUsed = currentElapsedTime();
            var remainingSeconds = minutesToSeconds( globalSpeechTimeString) - minutesToSeconds( minutesUsed);

            // Get all the remaining incomplete rows for the aff or neg team and set the time. 
            var rows = $(".incomplete."+speaker+" td:nth-child(3)");
            rows.eq(0).text( secondsToMinutes( remainingSeconds));
        }

        // Change the class of this row from current to completed.
        row.toggleClass("current completed");

        // See if the next row exists, if so toggle the class and display the next speech.
        var incompleteRows = $(".incomplete");
        if (incompleteRows.length > 0) {

            // Toggle the state on the first incomplete row to current.
            incompleteRows.eq(0).toggleClass("incomplete current");

            // There is a new "current", setup the speech.
            setupSpeech();
        }

        // Make sure the previous and next button states are correct.
        ButtonStateCheck();
    }
}


// Move up to the previous speech.
function prevSpeechClick() {

    // Make sure the timer is stopped.
    if ( timerRunning()) {
        startStopClick( );
    }

    // if there are any completed row.
    var rows = $(".completed");
    if ( rows.length > 0)
    {
        // If there is a current row.
        var currentRow = $(".current");
        if ( currentRow.length > 0) {
            currentRow.toggleClass("current incomplete");
        }

        // Change the state of the last completed row to 
        rows.eq( rows.length -1 ).toggleClass("current completed");

        // There is a new "current", setup the speech.
        setupSpeech();

        // Cehck the button state.
        ButtonStateCheck();
    }

}


function upDownArrowClick() {

    // Hide the current arrow.
    $(this).css('display', 'none');

    // Show the other.
    if ( $(this).attr("id") === "down-arrow") {
        console.log("down arrow click");
        $("#up-arrow").css('display', 'inline-block');
        $("#speech-speaker-table").slideDown(500);
    } else {
        console.log("up arrow click");
        $("#down-arrow").css('display', 'inline-block');
        $("#speech-speaker-table").slideUp(500);
    }
}




// Copy the speech time from the row to the display.
function setupSpeech() {

    // Pull the time for next speech row.
    globalSpeechTimeString = currentSpeechTime();

    // Set the value for the sand column graph.
    initSandColumn( globalSpeechTimeString);

    // Set the time on the screen.
    $("#timer-display").text( globalSpeechTimeString);

    // Set the speech and the speaker.
    $("#speech-heading").text( currentSpeech() );
    var speaker = currentSpeaker();

    // If this is not prep time, post the speaker, else nothing.
    if (speaker.substr(0,1) != "P") {
        $("#speaker-heading").text( globalSpeakers[speaker]);
    } else {
        $("#speaker-heading").text(" ");
    }
}


// Set the state of the active and inactive buttons.
function ButtonStateCheck() {

    // If there are no complete rows, the previous buttons should be inactive.
    var count = $(".completed").length;
    var prevState = (count === 0) ? 'inactive' : 'active';

    // If the previous button does not have the right state/class.
    var button = $('#prev-speech-button');
    if ( !button.hasClass(prevState) )
    {
        button.toggleClass('active inactive');
    }

    // If there are no incomplete rows, there is no "next" and so state should be inactive.
    count = $(".incomplete").length + $(".current").length;
    // console.log('count of incomplete and current is' + count);
    var nextState = (count === 0) ? 'inactive' : 'active';
    button = $('#next-speech-button');
    if ( !button.hasClass(nextState) )
    {
        button.toggleClass('active inactive');
    }

    // If there are no more incomplete or current rows, hide the fieldsets.
    if (count === 0) {
        $("#start-stop-button").slideUp(500);
        $("#timer-container").slideUp(500);
        $("#speech-speaker-fieldset").slideUp(500);
        $("#well-done-image").slideDown(1000);
    } else {
        $("#well-done-image").slideUp(1000);
        $("#speech-speaker-fieldset").slideDown(500);
        $("#timer-container").slideDown(500);
        $("#start-stop-button").slideDown(500);
    }

}



// Check and see if there is anything to lose;

function leavingPageWarning() {
    if ( $(".completed").length > 0) {
        return "Leaving the page will discard all recorded times!";
    }
}



// Speech Speaker Table ------------------------------------------

function currentSpeechTime() {
    return $(".current td:nth-child(3)").text();
}

function currentSpeech() {
    return $(".current td:nth-child(2)").text();
}

function currentSpeaker() {
    return $(".current td:nth-child(1)").text();
}

function currentElapsedTime() {
    return $(".current td:nth-child(4)").text();
}

// Update the table with the elapsed time (start time minus remaining time)
function postElapsedTime( remainingMinutes) {

    var elapsedSeconds = minutesToSeconds( globalSpeechTimeString) - minutesToSeconds( remainingMinutes);
    $(".current td:nth-child(4)").text( secondsToMinutes( elapsedSeconds) );
}


// Timer -------------------------------------------------------------------

var globalInterval; // ID for the interval timer. Must be saved to clear it later.

// Start the timer number display.
function startTimer()
{
    // get the time remaining from the timer display.
    var speechTimeString = $("#timer-display").text();

    // Add the timer value to get the stop time.
    globalStopSeconds = currentSeconds() + minutesToSeconds( speechTimeString);

    // Start the interval timer to trigger every second.
    globalInterval = setInterval( updateTimeDisplay, 1000);
}

// This is called once a second while the timer is running.
function updateTimeDisplay()
{
    // Get the current time in seconds and then get the difference from the stop seconds.
    var diff = globalStopSeconds - currentSeconds();

    // Set the time on the screen.
    $("#timer-display").text( secondsToMinutes( diff));

    // Update the sand column graph.    
    sandColumnUpdate( diff);

}

// Stop the timer.
function stopTimer() {

    if (globalInterval >= 0)
    {
        // Clear the interval 
        clearInterval( globalInterval);

        // Signal that the inteval has been stopped.
        globalInterval = undefined;

        // Record the elapsed time on the table.
        postElapsedTime( $("#timer-display").text() );
    }
}

function timerRunning() {
    return  (globalInterval !== undefined);
}




// Sand Column graph routines ------------------------------------

var globalSpeechSeconds; // Number of seconds in the speech for the graphing.
var globalClockElement; // The clock element in the DOM.
var globalSandContext; // The context for the sand column graph.

function initSandColumn( minutes ) {

    // Set the total seconds in the speech.
    globalSpeechSeconds = minutesToSeconds( minutes);
    // console.log("global speech seconds " + globalSpeechSeconds);

    // Set the global variables, the clock and the sand context.
    globalClockElement = document.getElementById('sand-column');
    globalSandContext = globalClockElement.getContext('2d');

    // Fill in the "sand" to the bottom.
    globalSandContext.fillStyle = 'rgb(176,168,131)'; // The "sand" color.
    globalSandContext.fillRect(0, 0, globalClockElement.width, globalClockElement.height);
}

function sandColumnUpdate( remaingSeconds) {

    // Set the color.
    globalSandContext.fillStyle = 'rgb(255,255,255)'; // 'white';

    // The fill for the amount of time used / total available * height.
    var secondsUsed = globalSpeechSeconds - remaingSeconds;
    var fillHeight = globalClockElement.height * (secondsUsed) / globalSpeechSeconds;

    // Draw in the white to show the sand going down.
    globalSandContext.fillRect(0, 0, globalClockElement.width, fillHeight);

}


// General Purpose Functions ------------------------------------------------


// Return the current time in seconds.
function currentSeconds() {
    return (new Date().valueOf() / 1000) | 0;
}


// Convert the string minutes like '1:05' to number seconds 65.
function minutesToSeconds( minutes) {
    // Pull the sign first because if minutes is zero, the sign is lost in the parse.
    var sign = 1;
    if (minutes.substr(0,1) == '-') {
        sign = -1;
        minutes = minutes.substr(1, minutes.length);
    }
    // console.log('minutes to seconds, sign is ' + sign);

    // break the minutes and seconds into two numbers in the array.
    var times = minutes.split(":");

    // return the number of seconds in the first portion, which also is signed.
    var returnValue = parseInt( times[0], 10) * 60;
    // console.log('minutes to seconds, parsed minutes is ' + returnValue);

    // return the sum of the first half and the second half.
    var seconds = parseInt( times[1],10) * sign;
    // console.log('minutes to seconds, seconds is ' + seconds);
    returnValue += seconds;
    return returnValue;
}


// Convert a number of seconds to a minutes string like 7:55 or -0:35.
function secondsToMinutes( seconds) {

    // Pull the sign from the incoming seconds.
    var sign = "";
    if (seconds < 0) {
        sign = '-';
        seconds = Math.abs(seconds);
    }

    // Get the minutes and seconds for the display value.
    var minutesPart = (seconds / 60) | 0; // Truncate the decimal portion
    var secondsPart = "0" + (seconds - (minutesPart * 60) );
    secondsPart = secondsPart.substr(-2,2);

    // Set the time on the screen.
    return sign + minutesPart + ":" + secondsPart;
}


// Get parameters from the URL string.
function GetURLParam(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam)
        {
            return sParameterName[1].replace('+', ' ');
        }
    }
}

