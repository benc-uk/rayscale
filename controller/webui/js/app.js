//
// On page load
//

// pass options to ace.edit
var editor = ace.edit(document.getElementById('editor'), {
    mode: "ace/mode/yaml",
    selectionStyle: "text",
    theme: "ace/theme/tomorrow_night",
    fontSize: "19px"
})

// Restore old job YAML
let oldjob = window.localStorage.getItem('rayScaleJob');
editor.setValue(oldjob)
jobRefresh();

//
//
//
function jobSubmitter() {
  let job = editor.getValue();
  window.localStorage.setItem('rayScaleJob', job);
  fetch("/api/jobs",
  {
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
//
//
function jobRefresh() {
  let table = document.getElementById('jobList');
  table.innerHTML = "";
  fetch("/api/jobs",
  {
      headers: {'Accept': 'application/json'},
      method: "GET",
  })
  .then(res => { 
    res.json().then(data => {
      for(let job of data.jobs) {
        let row = table.insertRow(0);
        var cell1 = row.insertCell(0);
        cell1.innerHTML = `<b>${job}</b>&nbsp;&nbsp;&nbsp;`;
        var cell2 = row.insertCell(1);
        let r = Math.random();
        cell2.innerHTML = `<a href='/jobs/${job}/render.png' target='${job}_render'><img class='minirender' src='/jobs/${job}/render.png?r=${r}'></a>`;
        var cell3 = row.insertCell(2);
        cell3.innerHTML = `<a class='btn btn-primary btn-lg' href='/jobs/${job}/result.json' target='${job}_result'>&nbsp;&nbsp; <i class="fas fa-info-circle"></i> &nbsp;&nbsp;</a>`;
        var cell4 = row.insertCell(3);
        cell4.innerHTML = `<a class='btn btn-primary btn-lg' href='/jobs/${job}/scene.json' target='${job}_scene'>&nbsp;&nbsp; <i class="fas fa-cubes"></i> &nbsp;&nbsp;</a>`;
      }
    });
    })
  .catch(err => {
    err.json().then(j => {document.getElementById('resp').value=("err "+JSON.stringify(j))});
  })
}
