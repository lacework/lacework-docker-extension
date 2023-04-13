import { Box, Button, ButtonGroup, Tab, Tabs, Modal, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { useEffect, useState } from "react";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

const cveModalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '70%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

function translateSeverity(severity) {
  if(severity==="Critical") return 5;
  if(severity==="High") return 4;
  if(severity==="Medium") return 3;
  if(severity==="Low") return 2;
  if(severity==="Info") return 1;
  return 0;
}
function sortSeverity(cveA,cveB) {
  let sevA=translateSeverity(cveA.severity);
  let sevB=translateSeverity(cveB.severity);
  if(sevA>sevB) return -1;
  if(sevB>sevA) return 1;
  return 0;
}
function sortCVEName(cveA,cveB) {
  if(cveA.name===cveB.name) return 0;
  if(!cveB.name.match(/CVE-/)) {
    if(cveB.name>cveA.name) return 1;
    return -1;
  }
  cveA = cveA.name.match(/CVE-(\d+)-(\d+)/);
  if(!cveA) return -1;
  cveB = cveB.name.match(/CVE-(\d+)-(\d+)/);
  if(!cveB) return -1;

  if(cveB[1]>cveA[1]) {
    return 1;
  } else if(cveB[1]===cveA[1]) {
    if(cveB[2]>cveA[2]) return 1;
    else return -1;
  } else {
    return -1;
  }
}
function filterFixable(fixable) {
  return (cve) => {
    if(fixable) {
      if(cve.fix_version==="") return false;
      else return true;
    } else {
      return true;
    }
  }
}

function renderCVE(cve,showVulnerability) {
  return (
    <tr key={cve.name} className="cve-tr">
      <td><Button variant="contained" className={"btn-cve btn-cve-"+cve.severity} fullWidth  onClick={()=>showVulnerability(cve)}>{cve.name}</Button></td>
      <td><Typography>{cve.pkg.namespace}</Typography></td>
      <td><Typography>{cve.pkg.name}</Typography></td>
      <td><Typography>{cve.pkg.version}</Typography></td>
      <td><Typography>{cve.fix_version}</Typography></td>
    </tr>
  )
}

function VulnCounts(props) {
  let critical=props.critical||0;
  let high=props.high||0;
  let medium=props.medium||0;
  let low=props.low||0;
  let info=props.info||0;
  return (
    <ButtonGroup sx={{marginRight:'1em'}}>
      <Button variant="contained" className={"btn-cve-layer btn-cve-Critical "+
        (critical===0?"btn-cve-bg-gray ":null)}>{critical}
      </Button>
      <Button variant="contained" className={"btn-cve-layer btn-cve-High "+
        (high===0?"btn-cve-bg-gray ":null)}>{high}
      </Button>
      <Button variant="contained" className={"btn-cve-layer btn-cve-Medium "+
        (medium===0?"btn-cve-bg-gray ":null)}>{medium}
      </Button>
      <Button variant="contained" className={"btn-cve-layer btn-cve-Low "+
        (low===0?"btn-cve-bg-gray ":null)}>{low}
      </Button>
      <Button variant="contained" className={"btn-cve-layer btn-cve-Info "+
        (info===0?"btn-cve-bg-gray ":null)}>{info}
      </Button>
    </ButtonGroup>
  );
}

function ScanResults(props) {
  let results = props.results?.results;
  const [cves,setCves] = useState([]);
  const [packages,setPackages] = useState([]);
  const [filter,setFilter] = useState({fixable:false});
  const [tab,setTab] = useState(0);
  const [cveDetailsOpen, setCveDetailsOpen] = useState(false);
  const [cve,setCve] = useState({})

  useEffect(() => {
    let filterUpdate = {};
    // if(results?.cve?.fixable_vulnerabilities) filterUpdate.fixable=true;
    if(results?.cve?.critical_vulnerabilities) filterUpdate.critical=true;
    if(results?.cve?.high_vulnerabilities) filterUpdate.high=true;
    if(results?.cve?.medium_vulnerabilities) filterUpdate.medium=true;
    setFilter(f => ({...f,...filterUpdate}));

    let cves = [];
    let packages = [];
    results?.cve?.image?.image_layers.forEach(layer => {
      layer.packages?.forEach(pkg => {
        // console.log(pkg);
        pkg.vulnerabilities.forEach(vuln => {
          if(cves.find(cve=>cve.name===vuln.name)) {
            // console.log('dup',cves.find(cve=>cve.name===vuln.name));
            cves.find(cve=>cve.name===vuln.name).layer.push(layer.hash);
          } else {
            cves.push({
              id: vuln.name,
              pkg: pkg,
              ...vuln,
              layer: [layer.hash]
            });
          }
          //update package inventory
        })
      })
      cves.forEach(cve => {
        if(!packages.find(pkg=>(cve.pkg.name===pkg.name&&cve.pkg.namespace===pkg.namespace))) {
          packages.push({vulnerabilities:[], ...cve.pkg});
        }
        let pkg = packages.find(pkg=>(cve.pkg.name===pkg.name&&cve.pkg.namespace===pkg.namespace));
        if(!pkg.vulnerabilities.find(v=>v.name===cve.name)) {
          pkg.vulnerabilities.push(cve);
        }
      })
    });
    cves = cves.sort(sortCVEName).sort(sortSeverity);
    packages.sort((a,b)=>a.vulnerabilities.length<b.vulnerabilities.length)
    setPackages(packages);
    setCves(cves);
  },[results])

  function cveDetailsClose() {
    setCveDetailsOpen(false);
  }
  function showVulnerability(vuln) {
    setCveDetailsOpen(true);
    setCve(vuln);
  }

  function useFilter(cve) {
    if(cve.fix_version==="" && filter.fixable) return false;
    if(cve.severity==="Critical" && filter.critical) return true;
    if(cve.severity==="High" && filter.high) return true;
    if(cve.severity==="Medium" && filter.medium) return true;
    if(cve.severity==="Low" && filter.low) return true;
    if(cve.severity==="Info" && filter.info) return true;
    return false;
  }
  function sortPkgVulnCount(a,b) {
    if(a.vulnerabilities.length<b.vulnerabilities.length) return 1;
    else return -1;
  }
  function getNamespacesFromPackages(packages) {
    let namespaces = [];
    packages.forEach(pkg => {
      if(!namespaces.find(ns=>ns===pkg.namespace)) {
        namespaces.push(pkg.namespace);
      }
    })
    return namespaces;
  }
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };
  if(Object.keys(results||{}).length<1) {
    if(props?.results?.result==="error") return (
      <Box className="scan_results">
        <Typography variant="h3">Scan Error</Typography>
        <Typography>{props.results.error}</Typography>
        {props.results?.stderr?(<>
          <Typography variant="h3">STDERR</Typography>
          <pre className="code_output">{props.results?.stderr}</pre>
        </>):null}
        {props.results?.stdout?(<>
          <Typography variant="h3">STDOUT</Typography>
          <pre className="code_output">{props.results?.stdout||"...no output..."}</pre>
        </>):null}
      </Box>
    )
    return (
      <Box className="scan_results">
        Results pending...
      </Box>
    )
  }

  function vulnCount(packages,severity) {
    let count = 0;
    packages.forEach(pkg => {
      count += pkg.vulnerabilities.filter(v=>v.severity===severity).length;
    })
    return count;
  }

  return (
    <Box className="scan_results">
      <Box sx={{marginBottom: '8px'}}>
        <Typography>
          <table>
            <tbody>
              <tr>
                <td>Scan results for</td><td><strong>{results?.cve?.image?.image_info?.repository}:{results?.cve?.image?.image_info?.tags[0]||'latest'}</strong></td>
              </tr>
              <tr>
                <td>Image digest</td><td><strong>{results?.cve?.image?.image_info?.image_digest}</strong></td>
              </tr>
            </tbody>
          </table>
        </Typography>
      </Box>
      <Box className="filters">
        <ButtonGroup>
          <Button variant={filter.fixable?"outlined":"contained"}
            onClick={()=>setFilter({...filter,fixable:!filter.fixable})}
          >
            All ({results?.cve?.total_vulnerabilities})
          </Button>
          <Button variant={filter.fixable?"contained":"outlined"}
            onClick={()=>setFilter({...filter,fixable:!filter.fixable})}
          >
            Fixable ({cves.filter(c=>c.fix_version).length})
          </Button>
        </ButtonGroup>
        &nbsp;&nbsp;&nbsp;
        <ButtonGroup>
          <Button variant={filter.critical?"contained":"outlined"}
            onClick={()=>setFilter({...filter,critical:!filter.critical})}
          >
            Critical ({cves.filter(c=>c.severity==="Critical").filter(filterFixable(filter.fixable)).length})
          </Button>
          <Button variant={filter.high?"contained":"outlined"}
            onClick={()=>setFilter({...filter,high:!filter.high})}
          >
            High ({cves.filter(c=>c.severity==="High").filter(filterFixable(filter.fixable)).length})
          </Button>
          <Button variant={filter.medium?"contained":"outlined"}
            onClick={()=>setFilter({...filter,medium:!filter.medium})}
          >
            Medium ({cves.filter(c=>c.severity==="Medium").filter(filterFixable(filter.fixable)).length})
          </Button>
          <Button variant={filter.low?"contained":"outlined"}
            onClick={()=>setFilter({...filter,low:!filter.low})}
          >
            Low ({cves.filter(c=>c.severity==="Low").filter(filterFixable(filter.fixable)).length})
          </Button>
          <Button variant={filter.info?"contained":"outlined"}
            onClick={()=>setFilter({...filter,info:!filter.info})}
          >
            Info ({cves.filter(c=>c.severity==="Info").filter(filterFixable(filter.fixable)).length})
          </Button>
        </ButtonGroup>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Vulnerabilities by CVE" />
          <Tab label="Vulnerabilities by Package" />
          <Tab label="Vulnerabilities by Layer" />
        </Tabs>
      </Box>
      <Box className="cve" role="tabpanel" hidden={0!==tab}>
        <Accordion><AccordionDetails>
        <table cellPadding={2} cellSpacing={0} className="cve-table">
          <thead>
            <tr>
              <th width="1"><Typography>CVE</Typography></th>
              <th className="cve-th-left"><Typography>Namespace</Typography></th>
              <th className="cve-th-left"><Typography>Package</Typography></th>
              <th className="cve-th-left"><Typography>Version</Typography></th>
              <th className="cve-th-left"><Typography>Fixed</Typography></th>
            </tr>
          </thead>
          <tbody class="odd-even-highlight">
            {cves.filter(c=>c.severity==="Critical").filter(useFilter).map(v => renderCVE(v,showVulnerability))}
            {cves.filter(c=>c.severity==="High").filter(useFilter).map(v => renderCVE(v,showVulnerability))}
            {cves.filter(c=>c.severity==="Medium").filter(useFilter).map(v => renderCVE(v,showVulnerability))}
            {cves.filter(c=>c.severity==="Low").filter(useFilter).map(v => renderCVE(v,showVulnerability))}
            {cves.filter(c=>c.severity==="Info").filter(useFilter).map(v => renderCVE(v,showVulnerability))}
          </tbody>
        </table>
        </AccordionDetails></Accordion>
      </Box>
      <Box className="packages" role="tabpanel" hidden={1!==tab}>
        {getNamespacesFromPackages(packages).map(ns => (
            <Accordion key={ns}>
            <AccordionSummary className="pkg-summary">
              <div style={{alignItems:'center'}}>
                <VulnCounts
                  critical={vulnCount(packages.filter(p=>p.namespace===ns),"Critical")}
                  high={vulnCount(packages.filter(p=>p.namespace===ns),"High")}
                  medium={vulnCount(packages.filter(p=>p.namespace===ns),"Medium")}
                  low={vulnCount(packages.filter(p=>p.namespace===ns),"Low")}
                  info={vulnCount(packages.filter(p=>p.namespace===ns),"Info")}
                />
              </div>
              <div>
                <Typography sx={{fontSize: '1rem !important'}}>package namespace:&nbsp;<strong style={{fontWeight: 'bold'}}>{ns}</strong></Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <table cellSpacing={0} cellPadding={2} style={{width:'100%'}} className="cve-pkg-table">
                <thead>
                <tr>
                  <th className="cve-pkg-th-left"><Typography>Package</Typography></th>
                  <th className="cve-pkg-th-left"><Typography>CVEs</Typography></th>
                  <th className="cve-pkg-th-left"><Typography>Fix Versions</Typography></th>
                </tr>
                </thead>
                <tbody className="odd-even-highlight">
                {packages.filter(p=>p.namespace===ns).filter(p=>p.vulnerabilities.filter(useFilter).length>0)
                  .sort(sortPkgVulnCount).map(pkg => (
                  <tr key={pkg.name}>
                    <td className="nowrap" style={{paddingRight:'8px'}}><Typography>{pkg.name}</Typography></td>
                    <td style={{paddingRight:'8px'}}>{pkg.vulnerabilities.sort(sortSeverity).filter(useFilter).map(v=>(<Button key={v.name} variant="contained" className={"btn-pkg-cve btn-cve btn-cve-"+v.severity}  onClick={()=>showVulnerability(v)}>
                      {v.name}
                    </Button>))}</td>
                    <td>
                      <Typography>{pkg.vulnerabilities.filter(v=>v.fix_version).filter(useFilter).map(v=>v.fix_version).sort().reverse().join(", ")||"no fix"}</Typography>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
      <Box className="layers" role="tabpanel" hidden={2!==tab}>
        {results?.cve?.image?.image_layers.map(layer => (
          <Accordion key={layer?.hash}>
            <AccordionSummary className="layers-summary">
              <div>
                <VulnCounts 
                  critical={vulnCount(layer.packages,"Critical")}
                  high={vulnCount(layer.packages,"High")}
                  medium={vulnCount(layer.packages,"Medium")}
                  low={vulnCount(layer.packages,"Low")}
                  info={vulnCount(layer.packages,"Info")}
                />
              </div>
              <div className="word-break-all"><Typography>{layer.created_by}</Typography></div>
            </AccordionSummary>
            <AccordionDetails>
              {layer.packages.length===0?<Typography>No vulnerabilities found!</Typography>:null}
              {layer.packages
              .filter(pkg => pkg.vulnerabilities.filter(useFilter).length>0)
              .map(pkg => (
                <div key={`${pkg.namespace}${pkg.name}${pkg.version}`} style={{marginBottom:'16px'}}>
                  <Typography><strong>{pkg.namespace}: {pkg.name} ({pkg.version})</strong></Typography>
                  {pkg.vulnerabilities.filter(useFilter).map(v => (
                    <Button key={v.name} variant="contained" className={"btn-pkg-cve btn-cve btn-cve-"+v.severity} onClick={()=>showVulnerability(v)}>
                      {v.name}
                    </Button>
                  ))}
                  <Typography>{pkg.vulnerabilities.filter(useFilter).length===0?"no vulnerabilities matching filter":""}</Typography>
                </div>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Dialog
        open={cveDetailsOpen}
        onClose={cveDetailsClose}
      >
        <DialogTitle className={"cve-"+cve?.severity}>{cve?.name}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Typography sx={{ mt: 2 }}>
              {cve?.description?.split("\\\\n").map(t=><div>{t}</div>)}
            </Typography>
            <Typography sx={{paddingTop:'2em'}}>
              For more details: <a href={cve?.link}>{cve?.link}</a>
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cveDetailsClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
      {/* <Modal
        open={cveDetailsOpen}
        onClose={cveDetailsClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={cveModalStyle}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            <h2 className={"cve-"+cve?.severity}>
              {cve?.name}
              <Button sx={{float:'right'}} onClick={cveDetailsClose} variant="contained">close</Button>
            </h2>
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            {cve?.description?.split("\\\\n").map(t=><div>{t}</div>)}
          </Typography>
          <Typography sx={{paddingTop:'2em'}}>
            For more details: <a href={cve?.link}>{cve?.link}</a>
          </Typography>
        </Box>
      </Modal> */}
    </Box>
  )
}

export default ScanResults;