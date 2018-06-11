var editor;

//
// This is run on page load
//
function pageLoad() {
  // Fake SPA routing
  var url = window.location.href; 
  hashIndex = url.indexOf('#')
  if(hashIndex > 0) {
    page = url.substr(hashIndex+1, url.length);
    selectPage(page);
  } else {
    // Select starting page
    selectPage('jobEdit');
  }

  // pass options to create ace editor
  editor = ace.edit(document.getElementById('editor'), {
    mode: "ace/mode/yaml",
    selectionStyle: "text",
    theme: "ace/theme/tomorrow_night",
    fontSize: "19px",
    tabSize: 2,
    useSoftTabe: true
  })

  // Restore old job YAML
  let oldjob = window.localStorage.getItem('rayScaleJob');
  editor.setValue(oldjob);
  
  // And update tables
  jobRefresh();
  tracerRefresh();
}

//
// Submit job to controller
//
function jobSubmitter() {
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
        $('#status').html('<i class="fas fa-exclamation-triangle"></i> Job submission failed: '+data.msg)
      });
    } else {
      statusBarUpdate();
    }
  })
  .catch(err => {
    $('#status').html('<i class="fas fa-exclamation-triangle"></i> Error occurred submitting job!')
  })
}

//
// Update status bar
//
var updaterId
function statusBarUpdate() {
  fetch("/api/status", {
      headers: { 'Accept': 'application/json' },
      method: "GET"
  })
  .then(res => { 
    res.json().then(data => { 
      if(data.job) {
        if(data.job.status == "RUNNING") {
          $('#status').html(`<i class="fa fa-sync fa-spin"></i>&nbsp; Job: ${data.job.name} is running. Completed ${data.job.tasksComplete} of ${data.job.taskCount} tasks...`)
        } else {
          clearTimeout(updaterId);
          $('#status').html(`Job: ${data.job.name} is ${data.job.status}. ${data.job.reason}`)
        }
      } else {
        clearTimeout(updaterId);
      }
    });
  })
  .catch(err => {
    $('#status').html('<i class="fas fa-exclamation-triangle"></i> Error occurred getting job status!')
    clearTimeout(updaterId);
  })

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
        row.append(`<td><a href='/jobs/${job}/render.png' 
          target='${job}_render'><img class='minirender' src='/jobs/${job}/render.png?r=${Math.random()}'></a></td>`);
        row.append(`<td><a class='btn btn-primary btn-lg' href='/jobs/${job}/result.json' 
          target='${job}_result'>&nbsp;<i class="fas fa-info-circle"></i> &nbsp; INFO &nbsp;</a></td>`);
        row.append(`<td><a class='btn btn-primary btn-lg' href='/jobs/${job}/job.yaml' 
          target='${job}_scene'>&nbsp;<i class="fas fa-cubes"></i> &nbsp; JOB &nbsp;</a></td>`);
        table.append(row);
      }
    });
  })
  .catch(err => {
    $('#status').html('<i class="fas fa-exclamation-triangle"></i> Error with job listing! '+err)
  })
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
    err.json().then(j => { document.getElementById('resp').value=("err "+JSON.stringify(j)) });
  })
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
  })

  $(`#${page}Page`).show();
  $(`#${page}Button`).addClass('active');
}