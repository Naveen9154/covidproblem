const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const ConOfStToRes = (ObjectDb) => {
  return {
    stateId: ObjectDb.state_id,
    stateName: ObjectDb.state_name,
    population: ObjectDb.population,
  };
};

app.get("/states/", async (request, response) => {
  const staLi = `SELECT * FROM state`;
  const stat = await db.all(staLi);
  response.send(stat.map((val) => ConOfStToRes(val)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const staLi = `SELECT * FROM state
    WHERE state_id=${stateId}`;
  const stat = await db.get(staLi);
  response.send(ConOfStToRes(stat));
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDis = `INSERT INTO
                    district (district_name,state_id,cases,cured,active,deaths)
            VALUES
            (
                '${districtName}',
                ${stateId},
                ${cases},
                ${cured},
                ${active},
                ${deaths});`;
  const dbResponse = await db.run(addDis);
  const districtId = dbResponse.lastId;
  response.send("District Successfully Added");
});

const ConOfDiToRes = (ObjectDb) => {
  return {
    districtId: ObjectDb.district_id,
    districtName: ObjectDb.district_name,
    stateId: ObjectDb.state_id,
    cases: ObjectDb.cases,
    cured: ObjectDb.cured,
    active: ObjectDb.active,
    deaths: ObjectDb.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const DisLi = `SELECT * FROM district
    WHERE district_id=${districtId}`;
  const Dis = await db.get(DisLi);
  response.send(ConOfDiToRes(Dis));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const DisLi = `DELETE FROM district
    WHERE district_id=${districtId}`;
  await db.get(DisLi);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const putDis = `UPDATE 
                   district
                  SET 
                  
                district_name=${districtName},
                state_id=${stateId},
                cases=${cases},
                cured=${cured},
                active=${active},
                deaths=${deaths},
               WHERE district_id=${districtId};`;
  await db.run(putDis);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const staLi = `SELECT 
                    SUM(cases) as totalCases,
                    SUM(cured) as totalCured,
                    SUM(active) as totalActive,
                    SUM(deaths)  as totalDeaths FROM district
    WHERE state_id=${stateId}`;
  const stat = await db.get(staLi);
  response.send(stat);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const DisLi = `SELECT 
                state_name AS stateName
                 FROM district  INNER JOIN state
                 ON district.state_id=state.state_id
    WHERE district_id=${districtId}`;
  const Dis = await db.get(DisLi);
  response.send(Dis);
});

module.exports = app;
