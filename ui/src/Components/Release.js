// import { Link } from "@mui/material";
import { Typography } from "@mui/material";
// import { useEffect, useState } from "react";
// import semver from 'semver';

function Release() {
  // let [latestRelease,setLatestRelease] = useState("0.0.0")
  // let [currentRelease,setCurrentRelease] = useState(process.env.REACT_APP_RELEASE||"0.0.0");

  // useEffect(() => {
  //   let version = semver.coerce(process.env.REACT_APP_RELEASE);
  //   if(version?.version) setCurrentRelease(version?.version||"unknown");
  //   fetch('https://api.github.com/repos/l6khq/lacework-docker-extension/releases')
  //   .then(result => result.json())
  //   .then(json => {
  //     if(json[0]) {
  //       setLatestRelease(json[0].tag_name||"unavailable");
  //     }
  //   })
  // },[])

  // function showCurrentRelease() {
  //   return (<span>
  //     extension version: {process.env.REACT_APP_RELEASE||"unknown"}
  //   </span>);
  // }

  // function showUpgradeRelease() {
  //   if(semver.valid(currentRelease) && semver.valid(latestRelease)) {
  //     if(semver.cmp(currentRelease,"<",latestRelease))
  //     return (<span><br />new release available: {latestRelease}</span>);  
  //   } else if(!semver.valid(currentRelease) && semver.valid(latestRelease)) {
  //     return (<span><br />please upgrade to {latestRelease}</span>);  
  //   }
  //   return null;
  // }
  return (
    <div className="release">
      <Typography color="disabled" >
        {/* {showCurrentRelease()}
        {showUpgradeRelease()}<br /> */}
        Copyright 2022 Lacework Inc., All Rights Reserved. Released under Apache 2.0 license.
      </Typography>
    </div>
  )
}

export default Release;
