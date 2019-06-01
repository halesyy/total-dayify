// analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-107685134-7']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

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

function renderTimes() {
  $('.times-container > .box-time').remove();
  chrome.storage.sync.get({timeo_times: "notset"}, function(result) {
    if (result.timeo_times == "notset") {
      var times = []
    } else {
      var times = result.timeo_times;
    }
    const today = new Date().getTime();

    // iterates through eahc
    for (timex in times) {
      // time.start, time.end, time.name
      const time = times[timex];
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

      $place = $(`<div class="box box-time"><div class="inside"><div style="width: ${percentage}%;" class="progress"><div class="display-name-left">${name} <a href="#" class="delete-time" data-id="${timex}">x</a></div><div class="display-name-right">${daysTill} days remaining</div></div></div></div>`);
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

  renderTimes();

  $(document).on('click', '.delete-time', function(event){
    event.preventDefault();
    // console.log("Going to delete " + );
    let toDelete = $(this).attr('data-id');
    deleteTimeFromId(toDelete);
    renderTimes();
    return false;
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
