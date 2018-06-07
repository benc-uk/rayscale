var editor;

//
// This is run on page load
//
function pageLoad() {
  // pass options to create ace editor
  editor = ace.edit(document.getElementById('editor'), {
      mode: "ace/mode/yaml",
      selectionStyle: "text",
      theme: "ace/theme/tomorrow_night",
      fontSize: "19px"
  })

  // Restore old job YAML
  let oldjob = window.localStorage.getItem('rayScaleJob');
  editor.setValue(oldjob);
  // And update job table
  jobRefresh();
  // Select starting page
  selectPage('jobEdit');
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
    res.json().then(j => { document.getElementById('resp').innerHTML = JSON.stringify(j) });
    })
  .catch(err => {
    err.json().then(j => { document.getElementById('resp').innerHTML = "err "+JSON.stringify(j)  });
  })
}

//
// Refresh job table
//
function jobRefresh() {
  let table = $('#jobList'); //document.getElementById('jobList');
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
        row.append(`<td><a href='/jobs/${job}/render.png' target='${job}_render'><img class='minirender' src='/jobs/${job}/render.png?r=${Math.random()}'></a></td>`);
        row.append(`<td><a class='btn btn-primary btn-lg' href='/jobs/${job}/result.json' target='${job}_result'>&nbsp;&nbsp; <i class="fas fa-info-circle"></i> &nbsp;&nbsp;</a></td>`);
        row.append(`<td><a class='btn btn-primary btn-lg' href='/jobs/${job}/job.yaml' target='${job}_scene'>&nbsp;&nbsp; <i class="fas fa-cubes"></i> &nbsp;&nbsp;</a></td>`);
        table.append(row);
      }
    });
  })
  .catch(err => {
    err.json().then(j => { document.getElementById('resp').value=("err "+JSON.stringify(j)) });
  })
}

function selectPage(page) {
  $('.page').each((i, e) => {
    $(e).hide();
  });

  $('.active').each((i, e) => {
    $(e).removeClass('active');
  })

  $(`#${page}Page`).show();
  $(`#${page}Button`).addClass('active');
}