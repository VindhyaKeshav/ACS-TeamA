const apiUrl = "http://localhost:3000";
function loadData() {
  // Get the two values from the frontend (replace with your actual data)
  const value1 = document.getElementById("numOfRecords").value;
  const value2 = document.getElementById("database").value;
  // Prepare the data to be sent
  const dataToSend = {
    records: value1,
    database: value2,
  };

  // Send a POST request to the backend to insert data into database
  fetch(`${apiUrl}/api/insert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataToSend),
  })
    .then((response) => response.json())
    .then((res) => {
      if(dataToSend.database=="sql")
      {
        var perf=document.getElementById("dataContainerSql");
        perf.textContent=`Load Time for Cloud SQL for ${dataToSend.records} records: ${res.data}`;
        perf.style.display='block';
      }
      if(dataToSend.database=="firestore")
      {
        var perf=document.getElementById("dataContainerFirestore");
        perf.textContent=`Load Time for Cloud Firestore for  ${dataToSend.records} records: ${res.data}`;
        perf.style.display='block';
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// To get data from the database to render on webpage
function queryData() {
  const value1 = document.getElementById("song").value;
  const value2 = document.getElementById("artist").value;
  const value3 = document.getElementById("year").value;
  const value4= document.getElementById("operator").value;
  const value5= document.getElementById("database-search").value;

  const dataToSend = {
    song: value1,
    artist: value2,
    year: value3,
    operator: value4,
    database: value5
  };
  fetch(`${apiUrl}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataToSend),
  })
    .then((response) => response.json())
    .then((res) => {
      if(res.status === 'success') {
        if(dataToSend.database=="sql")
        {
          var perf=document.getElementById("dataContainerSql-search");
          perf.textContent=`Search Time for Cloud SQL: ${res.time} `;
          perf.style.display='block';
        }
        if(dataToSend.database=="firestore")
        {
          var perf=document.getElementById("dataContainerFirestore-search");
          perf.textContent=`Search Time for Cloud Firestore: ${res.time}`;
          perf.style.display='block';
        }
        renderTable(res.data);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  
}

function renderTable(data) {
  var table = document.getElementById('myTable');
  if (!table) {
      console.error('Table element not found');
      return;
  }
  table.innerHTML='';
  var headers = Object.keys(data[0]);
  var headerRow = document.createElement('tr');
  headers.forEach(function (header) {
      var th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  data.forEach(function (item) {
      var row = document.createElement('tr');
      headers.forEach(function (header) {
          var td = document.createElement('td');
          td.textContent = item[header];
          row.appendChild(td);
      });
      table.appendChild(row);
  });
}
