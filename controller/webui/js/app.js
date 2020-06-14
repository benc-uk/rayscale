var editor;
require.config({ paths: { 'vs': 'js/monaco' }});

//
// This is run on page load
//
/* exported pageLoad */
function pageLoad() {
  // Fake SPA routing
  var url = window.location.href;
  let hashIndex = url.indexOf('#');
  if(hashIndex > 0) {
    let page = url.substr(hashIndex+1, url.length);
    selectPage(page);
  } else {
    // Select starting page
    selectPage('jobEdit');
  }

  // Pass options to create Monaco editor
  require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('editor'), {
      minimap: { enabled: false },
      theme: 'vs-dark',
      fontSize: '18px',
      language: 'yaml',
      useTabStops: false
    });

    // Restore old job YAML
    let oldjob = window.localStorage.getItem('rayScaleJob');
    editor.setValue(oldjob);
  });

  // And update tables
  jobRefresh();
  tracerRefresh();
  setStatus('...');

  // Ctrl+S starts job
  $(document).keydown(function(event) {
    if (!( String.fromCharCode(event.which).toLowerCase() == 's' && event.ctrlKey) && !(event.which == 19)) return true;
    jobSubmit();
    event.preventDefault();
    return false;
  });
}

//
// Submit job to controller
//
function jobSubmit() {
  let job = editor.getValue();
  window.localStorage.setItem('rayScaleJob', job);
  fetch("/api/jobs", {
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-yaml' },
    method: "POST",
    body: job
  })
    .then(res => {
      if(res.status != 200) {
        res.json().then(data => {
          setStatus('<i class="fas fa-exclamation-triangle"></i> Job submission failed: '+data.msg);
        });
      } else {
        statusBarUpdate();
      }
    })
    .catch(() => {
      setStatus('<i class="fas fa-exclamation-triangle"></i> Error occurred submitting job!');
    });
}

//
// Update status bar
//
var updaterId;
function statusBarUpdate() {
  fetch("/api/status", {
    headers: { 'Accept': 'application/json' },
    method: "GET"
  })
    .then(res => {
      res.json().then(data => {
        if(data.job) {
          if(data.job.status == "RUNNING") {
            setStatus(`<i class="fa fa-sync fa-spin"></i>&nbsp; Job: ${data.job.name} is running. Completed ${data.job.tasksComplete} of ${data.job.taskCount} tasks...`);
          } else {
            clearTimeout(updaterId);
            setStatus(`Job: ${data.job.name} is ${data.job.status}. ${data.job.reason}`);
          }
        } else {
          clearTimeout(updaterId);
        }
      });
    })
    .catch(() => {
      setStatus('<i class="fas fa-exclamation-triangle"></i> Error occurred getting job status!');
      clearTimeout(updaterId);
    });

  updaterId = setTimeout(statusBarUpdate, 2000);
}

//
// Refresh job table
//
function jobRefresh() {
  let table = $('#jobList');
  table.empty();
  table.innerHTML = "";
  fetch("/api/jobs", {
    headers: {'Accept': 'application/json'},
    method: "GET",
  })
    .then(res => {
      res.json().then(data => {
        for(let job of data.jobs) {
          let row = $('<tr/>');
          row.append(`<td><b>${job}</b></td>`);
          row.append(`<td><a href='/jobs/${job}/${job}.png' 
          target='${job}_render'><img class='minirender' src='/jobs/${job}/${job}.png?r=${Math.random()}'></a></td>`);
          row.append(`<td><a class='btn btn-primary btn-lg' href='/jobs/${job}/result.json' 
          target='${job}_result'>&nbsp;<i class="fas fa-info-circle"></i> &nbsp; INFO &nbsp;</a></td>`);
          row.append(`<td><a class='btn btn-primary btn-lg' href='/jobs/${job}/job.yaml' 
          target='${job}_scene'>&nbsp;<i class="fas fa-cubes"></i> &nbsp; JOB &nbsp;</a></td>`);
          table.append(row);
        }
      });
    })
    .catch(err => {
      setStatus('<i class="fas fa-exclamation-triangle"></i> Error with job listing! '+err);
    });
}

//
// Refresh tracer table
//
function tracerRefresh() {
  let table = $('#tracerList');
  table.empty();
  table.innerHTML = "";
  fetch("/api/tracers", {
    headers: {'Accept': 'application/json'},
    method: "GET",
  })
    .then(res => {
      res.json().then(data => {
        for(let tracer in data) {
          let row = $('<tr/>');
          row.append(`<td><b>${data[tracer].endPoint}</b></td>`);
          row.append(`<td><b>${data[tracer].id}</b></td>`);
          table.append(row);
        }
        $('#tracerCount').html(Object.keys(data).length);
      });
    })
    .catch(err => {
      err.json().then(j => { document.getElementById('resp').value=("err "+JSON.stringify(j)); });
    });
}

/* exported jobCancel */
function jobCancel() {
  fetch("/api/jobs/cancel", {
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-yaml' },
    method: "POST",
    body: {}
  })
    .then(res => {
      if(res.status == 200) {
        res.json().then(data => {
          setStatus('<i class="fas fa-exclamation-triangle"></i> '+data.msg);
          clearTimeout(updaterId);
        });
      }
    })
    .catch(() => {
      setStatus('<i class="fas fa-exclamation-triangle"></i> Error occurred cancelling job!');
    });
}

function selectPage(page) {
  // Fake SPA routing
  var url = window.location.href;
  url = url.substring(0, url.indexOf('#'));
  window.location.href = (url + '#' + page);

  $('.page').each((i, e) => {
    $(e).hide();
  });

  $('.active').each((i, e) => {
    $(e).removeClass('active');
  });

  $(`#${page}Page`).show();
  $(`#${page}Button`).addClass('active');
}

function setStatus(msg) {
  $('#status').attr('title', msg);
  $('#status').html(msg);
}