/*
 * Prefaces,
 * 1. Analytics
 * 2. Onclick events management
 * 3. Changing the page html
 */

//1
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-107685134-7']);
_gaq.push(['_trackPageview']);
(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

//2
$('body').on('click', 'a[target="_blank"]', function(e){
    e.preventDefault();
    chrome.tabs.create({url: $(this).prop('href'), active: true});
    return false;
});

var oldOrder = 1;

//3
$(document).ready(function(){
  $(document).on('change', '.change-page', event => {
    // fade out page
    const $body = $('.container');
    const p = $('.change-page').children("option:selected").val();

    const order = $('.change-page').children("option:selected").attr('data-order');
    // console.log(`The old order is ${window.lastOrder}, now = ${order}`);

    // setting directions
    if (order > oldOrder) {
      // going right, down the list
      var firstDirection = "left";
      var secondDirection = "right";
    }
    else {
      // going left, up the list
      var firstDirection = "right";
      var secondDirection = "left";
    }

    $body.hide("slide", { direction: firstDirection }, 200, function(){
      var ploc = `${p}.html`;
      var filelocation = chrome.extension.getURL(ploc)
      console.log(`Changing to ${ploc}`);
      $.get(filelocation, html => {
        // console.log(html);
        $body.html(html).show("slide", { direction: secondDirection, easing: "swing" }, 200);
        // $('body').html(html);
        if (p == 'pages/home-times') { initAll(); } // re-call inits
        console.log(`Set last order to ${order}`);
        oldOrder = order;
      });
    });

  });
});

$.get(chrome.extension.getURL("pages/home-times.html"), html => {
  $('.container').html(html).fadeIn(320);
  window.lastOrder = 1;
  return true;
});

/*
 * Function for deleting the time from it's given ID,
 * obtained from data-id in the DOM.
 */
function deleteTimeFromId(idx) {
  const timeidx = idx;
  chrome.storage.sync.get({timeo_times: "notset"}, function(result) {
    if (result.timeo_times == "notset") {
      var times = []
    } else {
      var times = result.timeo_times;
    }
    times.splice(idx, 1);
    chrome.storage.sync.set({timeo_times: times}, function() {
      console.log('Value is set to ' + times);
      closeAdjuster();
      renderTimes();
    });
  });
}

/*
 * Initiating the main notification for the new user/version,
 * if a user opens a new version, it will give off the message
 * to even an existing user.
 */
function notification(name=false) {
  const notif = {
    title: "What's new in version 2?!",
    message: "<ul><li>Cleaner application (ref. K)</li><li><b>New areas</b> (click above)</li><li>More animations</li><li>Auto-capitalized task names</li></ul>"
  };
  chrome.storage.sync.get({"notif_2": "hasnt_seen"}, function(result){
    if (result.notif_2 == "hasnt_seen") {
      console.log("going to change that!");
      $notification = `<div class="notification box">
        <div class="inside">
          <div class="notif-title">
            ${notif.title} (click to remove)
          </div>
          <div class="notif-message">
            ${notif.message}
          </div>
        </div>
      </div>`;
      $('.times-container').append($notification);
    }
  });
}
/*
 * For "reading" the above emitted notificatin,
 * this stops the above from placing the notification in
 * the browser.
 */
function notification_read(name=false) {
  chrome.storage.sync.set({"notif_2": "seen"}, function(result){
    console.log('Seen notification ' + result);
  });
}


/*
 * Main rendering function, for rendering all of the
 * times into the main UI.
 */
function renderTimes() {
  $('.times-container > .box-time').remove();
  chrome.storage.sync.get({timeo_times: "notset"}, function(result) {
    if (result.timeo_times == "notset") {
      var times = []
    } else {
      var times = result.timeo_times;
    }
    const today = new Date().getTime();
    times.sort(function(a, b){
        var keyA = new Date(a.end),
            keyB = new Date(b.end);
        // Compare the 2 dates
        if(keyA < keyB) return -1;
        if(keyA > keyB) return 1;
        return 0;
    });
    for (timex in times) {
      const time = times[timex];

      if ('link' in time) {
        var link = time.link;
      }
      else {
        var link = "";
      }

      var name = time.name;
      var nameCap = time.name.charAt(0).toUpperCase() + time.name.slice(1);
      var name = nameCap;

      // deciding whether or not to make name a link
      if (link != "") {
        name = `<a href="${link}" title="${link}" target="_blank">${name}</a>`;
      }

      const endDate = new Date(time.end);
      const startDate = new Date(time.start);
      const endTimestamp = endDate.getTime();
      const startTimestamp = startDate.getTime();
      const eventEndTime = endDate.getTime();

      // getting the daysTill
      var daysDifference = (eventEndTime - today) / (1000 * 60 * 60 * 24);
      var daysTill = Math.ceil(daysDifference);
      if (daysTill <= 0) continue;

      // getting the % so far
      // ((today) / (end - start)) * 100
      var percentage = Math.round(((today - startTimestamp)/(endTimestamp - startTimestamp)) * 100, 2)

      var displayName = `${name} - ${daysTill} days remaining`;

      if (daysTill <= 1) var dayType = "day";
      else var dayType = "days";

      $place = $(`<div class="box box-time">
            <div class="main-title">
              ${name}
              <div style="float: right;">
                <a href="#" style="margin-right: 3px" class="set-home time-button" data-link="${link}" data-id="${timex}" title="Set up a link (eg. Google Doc) to load when clicking on this task.">Home</a>
                <a href="#" class="delete-time time-button" data-id="${timex}" title="Remove this time.">Delete</a>
              </div>
            </div>
            <div class="inside">
              <div style="width: ${percentage}%;" class="progress">
                <div class="display-name-left"></div>
                <div class="display-name-right" title="Working hard or hardly working?">
                  ${daysTill} ${dayType} remaining
                </div>
              </div>
            </div>
          </div>`);
      $('.times-container').append($place);
    }
  });
}

/*
 * Function for closing the adjuster once it has been used.
 */
function closeAdjuster() {
  $('.operable-new').removeClass('not-visible');
  $('.adjust').removeClass('adjust-extended');
  $('.operable-place-input').addClass('not-visible');
}

/*
 * Does the safety sort, then saves it after sorting it.
 */
function sortForSafety() {
  chrome.storage.sync.get({timeo_times: "notset"}, function(results){
    var times = results.timeo_times;
    if (times == "notset") times = [];
    console.log("Sorted..");
    times.sort(function(a, b){
        var keyA = new Date(a.end),
            keyB = new Date(b.end);
        if(keyA < keyB) return -1;
        if(keyA > keyB) return 1;
        return 0;
    });
    chrome.storage.sync.set({timeo_times: times}, function(results){
      console.log("Saved sort..");
    });
  });
}












// Flow start
$(document).ready(initAll);

function initAll() {
  sortForSafety(); // makes sure that the times are always in the correct order
  notification();  // loading notifs if any
  renderTimes();   // rendering all the times to the UI

  /*
   * Any "off" call is to remove any that are being
   * stored as extras, from the recalls of this file.
   */
  $(document).off('click');
  $(document).off('keyup');
  $(document).on('click', '.delete-time', function(event){
    event.preventDefault();
    let toDelete = $(this).attr('data-id');
    deleteTimeFromId(toDelete);
    renderTimes();
    return false;
  });

  /*
   * Deleting notif handler.
   */
  $(document).on('click', '.notification', function(event){
    console.log("going to remove!");
    notification_read();
    $(this).fadeOut(250);
  });

  $(document).on('click', '.set-home', function(event){
    event.preventDefault();
    let toDelete = $(this).attr('data-id');
    $this = $(this);
    $parent = $this.parent().parent().parent();
    $('.time-setting-input').remove(); // causing no duplicates
    $parent.append(`<input type="text" data-id="${toDelete}" value="${$this.attr('data-link')}" placeholder="Link to something related to getting this DONE e.g. Google Doc" class="time-setting-input" />`);
    return false;
  });

  $(document).on('keyup', '.time-setting-input', function(event){
    if (event.which == 13) {
      console.log("going to wait for time setter lol gotta go edit it and re-render");
      console.log("oh also delete me the second its an enter");

      // gotta:
      // 1. get input
      // 2. get the times var
      // 3. access with respect to data-id
      // 4. edit data-id piece to input
      // 5. set
      const link = $(this).val();
      const id = $(this).attr('data-id');
      console.log(`going to change ${id} to ${link}`);

      chrome.storage.sync.get({timeo_times: "notset"}, function(results){
        const times = results.timeo_times;
        times[id].link = link;
        console.log(times);
        chrome.storage.sync.set({timeo_times: times}, function(results){
          $('.time-setting-input').remove();
          renderTimes();
        });
      });
    }
  });

  // When wanting to open the window to give a new idea.
  $('.operable-new').off('click');
  $('.operable-new').click(function(){
      $('.operable-new').addClass('not-visible');
      $('.adjust').addClass('adjust-extended');
      $('.operable-place-input').removeClass('not-visible');
  });

  // Closing the form
  $('.close-form').off('click');
  $('.close-form').click(closeAdjuster);

  // Setting the default dates.
  $('.setToToday').val(new Date().toISOString().slice(0, 10));

  // Managing the submission of the form to create
  // a new date.
  $('#form-new').off('submit');
  $('#form-new').submit(function(event){
    event.preventDefault();
    const $start = $('#start'), $finish = $('#finish'), $name = $('#name');
    const start = $start.val(), finish = $finish.val(), name = $name.val();
    $name.val('');
    // getting the current times, appending, then adding the new data in
    chrome.storage.sync.get({timeo_times: "notset"}, function(result) {
      if (result.timeo_times == "notset") {
        var times = []
      } else {
        var times = result.timeo_times;
      }
      times.push({
        start: start,
        end: finish,
        name: name
      });
      times.sort(function(a, b){
          var keyA = new Date(a.end),
              keyB = new Date(b.end);
          // Compare the 2 dates
          if(keyA < keyB) return -1;
          if(keyA > keyB) return 1;
          return 0;
      });
      chrome.storage.sync.set({timeo_times: times}, function() {
        console.log('Value is set to ' + times);
        closeAdjuster();
        renderTimes();
      });
    });
    return false;
  });
}
