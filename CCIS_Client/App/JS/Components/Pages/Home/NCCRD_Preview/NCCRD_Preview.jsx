import React from 'react'
import { Row, Col, Button } from 'mdbreact'
import { connect } from 'react-redux'
import OData from 'react-odata'
import ProjectCard from './ProjectCard.jsx'
import { ccrdBaseURL } from '../../../../Config/serviceURLs.cfg'
import NCCRD from '../../Tools/NCCRD.jsx'

//images
import popout from '../../../../../Images/Icons/popout.png'

const mapStateToProps = (state, props) => {
  return {}
}

const mapDispatchToProps = (dispatch) => {
  return {}
}

class NCCRD_Preview extends React.Component {

  constructor(props) {
    super(props);

    this.onMessage = this.onMessage.bind(this)

    this.state = {
      showNCCRD: ""
    }
  }

  componentDidMount() {
    window.addEventListener('message', this.onMessage.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener("message", this.onMessage)
  }

  onMessage(event) {

    //console.log("event", event)

    // Check sender origin to be trusted
    if (event.origin === "http://localhost:8085" || event.origin === "http://app01.saeon.ac.za/nccrdsite") {

      var data = event.data;
      console.log("event data", data)

      if (data.action === "showDetails") {
        this.setState({ showNCCRD: data.value })
      }

    }
  }

  render() {

    let { showNCCRD } = this.state

    let NCCRD_Config = {
      header: false,
      navbar: false,
      sidenav: false,
      footer: false,
      daoid: false,
      readOnly: true,
      backToList: false,
      // filters: {
      //   region: 0,
      //   sector: 0,
      //   status: 0,
      //   title: "",
      //   typology: 0,
      //   polygon: ""
      // },
      listOptions: {
        expandCollapse: false,
        view: true,
        favorites: false,
        filters: false,
        detailsInParent: true
      }
    }

    return (
      <>
        <iframe
          style={{
            border: "none",
            height: 437,
            width: "100%"
          }}
          src={`http://localhost:8085/#/projects?config=${encodeURI(JSON.stringify(NCCRD_Config))}`}
        />

        {
          (showNCCRD !== "") &&
          <NCCRD
            path={`projects/${showNCCRD}`}
            query={`?config=${encodeURI(JSON.stringify(NCCRD_Config))}`}
            closeCallback={() => { this.setState({ showNCCRD: "" }) }}
          />
        }

      </>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NCCRD_Preview)