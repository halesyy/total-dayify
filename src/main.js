// analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-107685134-7']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

$('body').on('click', 'a[target="_blank"]', function(e){
    e.preventDefault();
    chrome.tabs.create({url: $(this).prop('href'), active: false});
    return false;
});

function deleteTimeFromId(idx) {
  const timeidx = idx;

  chrome.storage.sync.get({timeo_times: "notset"}, function(result) {
    if (result.timeo_times == "notset") {
      var times = []
    } else {
      var times = result.timeo_times;
    }
    times.splice(idx, 1);
    // times.push({
    //   start: start,
    //   end: finish,
    //   name: name
    // });
    chrome.storage.sync.set({timeo_times: times}, function() {
      console.log('Value is set to ' + times);
      closeAdjuster();
      renderTimes();
    });
  });

}

function notification(name=false) {
  const notif = {
    title: "What's new in 1.1.0?",
    message: "Well, first of all I made these little dismissable notifications. Also: <ul><li>Cleaner app</li><li>Times are listed in priority ascending</li><li>Clicking 'home' next to a task adds a link to it</li></ul>"
  };

  chrome.storage.sync.get({"notif_110": "hasnt_seen"}, function(result){
    if (result.notif_110 == "hasnt_seen") {
      console.log("going to change that!");
      // place in notification
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
    else {
      // ignore
    }
  });
}
function notification_read(name=false) {
  chrome.storage.sync.set({"notif_110": "seen"}, function(result){
    console.log('Seen notification ' + result);
  });
}
// watcher for when the notif is clicked on
$(document).on('click', '.notification', function(event){
  console.log("going to remove!");
  notification_read();
  $(this).fadeOut(250);
});


function renderTimes() {
  $('.times-container > .box-time').remove();
  chrome.storage.sync.get({timeo_times: "notset"}, function(result) {
    if (result.timeo_times == "notset") {
      var times = []
    } else {
      var times = result.timeo_times;
    }
    const today = new Date().getTime();
    /*{
      start: start,
      end: finish,
      name: name
    }*/
    times.sort(function(a, b){
        var keyA = new Date(a.end),
            keyB = new Date(b.end);
        // Compare the 2 dates
        if(keyA < keyB) return -1;
        if(keyA > keyB) return 1;
        return 0;
    });
    // iterates through eahc
    for (timex in times) {
      // time.start, time.end, time.name
      const time = times[timex];

      // checking for a link attr
      if ('link' in time) {
        var link = time.link;
      }
      else {
        var link = "";
      }

      const name = time.name;
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

      var displayName = `${time.name} - ${daysTill} days remaining`;

      if (daysTill <= 1) var dayType = "day";
      else var dayType = "days";

      $place = $(`<div class="box box-time">
            <div class="inside">
              <div style="width: ${percentage}%;" class="progress">
                <div class="display-name-left">
                  ${name}
                  <a href="#" class="delete-time time-button" data-id="${timex}" title="Remove this time.">delete</a> -
                  <a href="#" class="set-home time-button" data-link="${link}" data-id="${timex}" title="Set up a link (eg. Google Doc) to load when clicking on this task.">home</a>
                </div>
                <div class="display-name-right">
                  ${daysTill} ${dayType} remaining
                </div>
              </div>
            </div>
          </div>`);
      $('.times-container').append($place);
    }
  });

}

function closeAdjuster() {
  $('.operable-new').removeClass('not-visible');
  $('.adjust').removeClass('adjust-extended');
  $('.operable-place-input').addClass('not-visible');
}

$(document).ready(function(){

  notification(); // loading notifs if any
  renderTimes();

  $(document).on('click', '.delete-time', function(event){
    event.preventDefault();
    // console.log("Going to delete " + );
    let toDelete = $(this).attr('data-id');
    deleteTimeFromId(toDelete);
    renderTimes();
    return false;
  });

  $(document).on('click', '.set-home', function(event){
    event.preventDefault();
    // console.log("Going to delete " + );
    let toDelete = $(this).attr('data-id');
    // deleteTimeFromId(toDelete);
    // renderTimes();
    $this = $(this);
    $parent = $this.parent().parent().parent().parent();
    $('.time-setting-input').remove(); // causing no duplicates
    $parent.append(`<input type="text" data-id="${toDelete}" class="time-setting-input" />`);

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
        var times = results.timeo_times;
        times[id].link = link;
        console.log(times);
        chrome.storage.sync.set({timeo_times: times}, function(results){
          console.log('Value is set to ' + results);
        });
      });


    }

  });


  $('.operable-new').click(function(){
      // starting to allow the user to setup their new task

      $('.operable-new').addClass('not-visible');
      $('.adjust').addClass('adjust-extended');
      $('.operable-place-input').removeClass('not-visible');

  });

  $('.close-form').click(function(){
    closeAdjuster();
  });

  $('.setToToday').val(new Date().toISOString().slice(0, 10));

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

    // console.log($start.val(), $finish.val(), $name.val());
    return false;
  });

});
