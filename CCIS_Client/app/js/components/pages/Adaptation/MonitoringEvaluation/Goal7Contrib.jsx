'use strict'

import React from 'react'
import { connect } from 'react-redux'
import { Row, Col, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, Container } from 'mdbreact'
import TextInput from '../../../input/TextInput.jsx'
import { DEAGreen, DEAGreenDark, Red, Amber, Green } from '../../../../config/colours.cfg'
import { apiBaseURL, ccrdBaseURL, vmsBaseURL } from '../../../../config/serviceURLs.cfg'
import FileUpload from '../../../input/FileUpload.jsx'
import OData from 'react-odata'
import buildQuery from 'odata-query'
import TreeSelectInput from '../../../input/TreeSelectInput.jsx'

import gear from '../../../../../images/gear.png'
import checklist from '../../../../../images/checklist.png'

const _gf = require('../../../../globalFunctions')

const mapStateToProps = (state, props) => {
  let user = state.oidc.user
  return { user }
}

const mapDispatchToProps = (dispatch) => {
  return {
    updateNav: payload => {
      dispatch({ type: "NAV", payload })
    },
    setLoading: payload => {
      dispatch({ type: "SET_LOADING", payload })
    }
  }
}

const defaultState = {
  editing: false,
  messageModal: false,
  message: "",
  title: "",
  goalStatus: "R",
  goalId: _gf.GetUID(),
  Q7_1: 1, //ResultingChange
  Q7_2: "", //EvidenceLink
  Q7_3: 0, //Region
  Q7_4: 0, //Institution
  Q7_5: "" //InstitutionCustom
}

class Goal7Contrib extends React.Component {

  constructor(props) {
    super(props);

    this.submit = this.submit.bind(this)
    this.reset = this.reset.bind(this)
    this.showMessage = this.showMessage.bind(this)
    this.assessGoalStatus = this.assessGoalStatus.bind(this)

    this.state = defaultState
  }

  componentDidMount() {
    this.props.updateNav(location.hash)
  }

  componentDidUpdate() {
    let { editGoalId } = this.props
    if (editGoalId) {
      this.getEditGoalData(editGoalId)
    }

    this.assessGoalStatus()
  }

  assessGoalStatus() {

    let { goalStatus, Q7_1 } = this.state
    let newGoalStatus = "R"
    let redPoints = 0
    let amberPoints = 0
    let greenPoints = 0

    //Check red conditions
    if (Q7_1 === 1) {
      redPoints += 1
    }

    //Check amber conditions
    if (Q7_1 === 2) {
      amberPoints += 1
    }

    //Check green conditions
    if (Q7_1 === 3) {
      greenPoints += 1
    }

    //Parse result to status colour    
    if (greenPoints > 0) {
      newGoalStatus = "G"
    }
    else if (amberPoints > 0) {
      newGoalStatus = "A"
    }
    else if (redPoints > 0) {
      newGoalStatus = "R"
    }

    //Update status
    if (newGoalStatus !== goalStatus) {
      this.setState({ goalStatus: newGoalStatus })
    }
  }

  async waitForMessageClosed() {

    while (this.state.messageModal === true) {
      await _gf.wait(250)
    }

    return true
  }

  async getEditGoalData(editGoalId) {

    this.props.setLoading(true)
    this.props.resetEdit()

    //Fetch goal details from server
    const query = buildQuery({
      filter: { Id: { eq: { type: 'guid', value: editGoalId.toString() } } },
      expand: "Questions"
    })

    try {
      let res = await fetch(apiBaseURL + `Goals${query}`)
      res = await res.json()
      if (res.value && res.value.length > 0) {
        let data = res.value[0]
        this.setState({
          editing: true,
          goalId: editGoalId,
          Q7_1: parseInt(data.Questions.filter(x => x.Key === "ResultingChange")[0].Value),
          Q7_2: data.Questions.filter(x => x.Key === "EvidenceLink")[0].Value,
          Q7_3: parseInt(data.Questions.filter(x => x.Key === "Region")[0].Value),
          Q7_4: parseInt(data.Questions.filter(x => x.Key === "Institution")[0].Value),
          Q7_5: data.Questions.filter(x => x.Key === "InstitutionCustom")[0].Value
        })
      }

      this.props.setLoading(false)
    }
    catch (ex) {
      this.props.setLoading(false)
      console.error(ex)
    }
  }

  async reset() {

    await this.waitForMessageClosed();

    this.setState({ ...defaultState, goalId: _gf.GetUID() })

    setTimeout(() => {
      window.scroll({
        top: 180,
        left: 0,
        behavior: 'smooth'
      })
    }, 100)
  }

  async submit() {

    let { goalId, goalStatus, Q7_1, Q7_2, Q7_3, Q7_4, Q7_5 } = this.state
    let { setLoading, user } = this.props

    setLoading(true)

    //Construct post body
    let goal = {
      Id: goalId,
      CreateUser: user.profile.UserId,
      Status: goalStatus,
      Type: 7,
      Questions: [
        { Key: "ResultingChange", Value: Q7_1.toString() },
        { Key: "EvidenceLink", Value: Q7_2 },
        { Key: "Region", Value: Q7_3.toString() },
        { Key: "Institution", Value: Q7_4.toString() },
        { Key: "InstitutionCustom", Value: Q7_5 }
      ]
    }

    //Submit
    try {
      let res = await fetch(apiBaseURL + 'Goals', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (user === null ? "" : user.access_token)
        },
        body: JSON.stringify(goal)
      })

      if (!res.ok) {
        //Get response body
        res = await res.json()
        throw new Error(res.error.message)
      }

      setLoading(false)
      this.showMessage("Success", "Goal submitted successfully")
      await this.waitForMessageClosed()
      this.reset()
    }
    catch (ex) {
      setLoading(false)
      console.error(ex)
      this.showMessage("An error occurred", ex.message)
    }
  }

  showMessage(title, message) {
    this.setState({
      title,
      message,
      messageModal: true
    })
  }

  render() {

    let { editing, goalStatus, goalId, Q7_1, Q7_2, Q7_3, Q7_4, Q7_5 } = this.state

    return (
      <>
        <Row style={{ marginLeft: "0px" }}>
          <Col md="12">
            <hr style={{ marginBottom: "15px", marginTop: "5px" }} />
          </Col>
          <Col md="1">
            <img src={gear} style={{ height: "40px", marginBottom: "10px", marginLeft: "0px", marginRight: "5px" }} />
          </Col>
          <Col md="11">
            <h5 style={{ marginTop: "8px" }}>
              Goal 7. Evidence of reduced risk/vulnerability as a result of addressing the identified risk/vulnerability.
            </h5>
            <p style={{ marginTop: "20px", marginBottom: "2px" }}>
              <b>What is being monitored and evaluated:</b>
            </p>
            <p>
              Evidence of reduced risk/vulnerability as a result of addressing the identified risk/vulnerability.
            </p>
            <p style={{ marginBottom: "3px" }}>
              <b>How it is being evaluated:</b>
            </p>
            <table style={{ width: "95%" }}>
              <tbody>
                <tr style={{ backgroundColor: Red }}>
                  <td style={{ color: "white", padding: "10px" }}>
                    <p style={{ marginBottom: "0px" }}>
                      <b>RED </b>
                      Lack of behavioural/system/infrastructure change/modification as a result of
                      addressing identified risks (including climate risk) and vulnerabilities to
                      reduce climate change impacts
                    </p>
                  </td>
                </tr>
                <tr style={{ backgroundColor: Amber }}>
                  <td style={{ color: "white", padding: "10px" }}>
                    <p style={{ marginBottom: "0px" }}>
                      <b>AMBER </b>
                      Evidence of reactive behavioural/system/infrastructure change/modification as
                      a result of addressing identified risks (including climate risk) and vulnerabilities
                      to reduce climate change impacts.
                    </p>
                  </td>
                </tr>
                <tr style={{ backgroundColor: Green }}>
                  <td style={{ color: "white", padding: "10px" }}>
                    <p style={{ marginBottom: "0px" }}>
                      <b>GREEN </b>
                      Evidence of proactive behavioural/system/infrastructure change/modification as
                      a result of addressing identified risks (including climate risk) and vulnerabilities
                      to reduce climate change impacts.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            <br />
          </Col>
          <Col md="12">
            <hr style={{ marginBottom: "20px", marginTop: "0px" }} />
          </Col>
        </Row>

        <Row style={{ marginLeft: "0px" }}>

          <Col md="1">
            <img src={checklist} style={{ height: "40px", marginBottom: "10px", marginLeft: "0px", marginRight: "5px" }} />
          </Col>
          <Col md="11">
            <h5 style={{ fontWeight: "bold", marginTop: "8px" }}>
              Goal 7 Assessment
            </h5>
            <br />

            <Row>
              <Col md="12">
                <label style={{ fontWeight: "bold" }}>
                  7.1 Behavioural/system/infrastructure change/modification as a result of addressing
                  identified risks (including climate risk) and vulnerabilities to reduce climate change impacts.
                </label>
                <div style={{ marginLeft: "-22px", marginTop: "-10px" }}>
                  <Input
                    onClick={() => { this.setState({ Q7_1: 1 }) }}
                    checked={Q7_1 === 1 ? true : false}
                    label="No or low behavioural/system/infrastructure change/modification as a result of addressing identified risks (including climate risk) and vulnerabilities to reduce climate change impacts."
                    type="radio"
                    id="radRV1"
                  />
                  <Input
                    onClick={() => { this.setState({ Q7_1: 2 }) }}
                    checked={Q7_1 === 2 ? true : false}
                    label="Evidence of reactive behavioural/system/infrastructure change/modification as a result of addressing identified risks (including climate risk) and vulnerabilities to reduce climate change impacts."
                    type="radio"
                    id="radRV2"
                  />

                  <Input
                    onClick={() => { this.setState({ Q7_1: 3 }) }}
                    checked={Q7_1 === 3 ? true : false}
                    label="Evidence of proactive behavioural/system/infrastructure change/modification as a result of addressing identified risks (including climate risk) and vulnerabilities to reduce climate change impacts."
                    type="radio"
                    id="radRV3"
                  />
                </div>
              </Col>
            </Row>

            <Row style={{ marginTop: "15px", marginBottom: "7px" }}>
              <Col md="12">
                <label style={{ fontWeight: "bold" }}>
                  7.2 Add attachments to any evidence:
                </label>
                <br />
                <TextInput
                  width="95%"
                  value={Q7_2}
                  callback={(value) => {
                    value = _gf.fixEmptyValue(value, "")
                    this.setState({ Q7_2: value })
                  }}
                  readOnly={true}
                />
              </Col>
            </Row>
            <Row style={{ marginBottom: "7px" }}>
              <Col md="4">
                <FileUpload
                  key={"fu_" + goalId}
                  style={{ marginTop: "-15px", marginBottom: "20px" }}
                  width="100%"
                  callback={(fileInfo) => { this.setState({ Q7_2: fileInfo.ViewLink }) }}
                  goalId={goalId}
                />
              </Col>
            </Row>

            <Row>
              <Col md="8">
                <label style={{ fontWeight: "bold" }}>
                  7.3 Select a Region for this plan?
                </label>

                <OData
                  baseUrl={vmsBaseURL + 'Regions'}>

                  {({ loading, error, data }) => {

                    let processedData = []

                    if (loading) {
                      processedData = [{ id: "Loading...", value: "Loading..." }]
                    }

                    if (error) {
                      console.error(error)
                    }

                    if (data) {
                      if (data.items && data.items.length > 0) {
                        processedData = data.items
                      }
                    }

                    return (
                      <TreeSelectInput
                        data={processedData}
                        transform={(item) => { return { id: item.id, text: item.value, children: item.children } }}
                        value={Q7_3}
                        callback={(value) => { this.setState({ Q7_3: value.id }) }}
                        allowClear={true}
                        placeHolder={"Select Region...  (Leave empty for 'National')"}
                      />
                    )

                  }}
                </OData>
              </Col>
            </Row>
            <br />

            <Row>
              <Col md="8">
                <label style={{ fontWeight: "bold" }}>
                  7.4 Select your Institution/Organisation?
                </label>

                <OData
                  baseUrl={vmsBaseURL + 'SAGovDepts'}>

                  {({ loading, error, data }) => {

                    let processedData = []

                    if (loading) {
                      processedData = [{ id: "Loading...", value: "Loading..." }]
                    }

                    if (error) {
                      console.error(error)
                    }

                    if (data) {
                      if (data.items && data.items.length > 0) {
                        processedData = data.items
                      }
                    }

                    return (
                      <TreeSelectInput
                        data={processedData}
                        transform={(item) => { return { id: item.id, text: item.value, children: item.children } }}
                        value={Q7_4}
                        callback={(value) => { this.setState({ Q7_4: value.id }) }}
                        allowClear={true}
                        placeHolder={"Select Institution/Organisation...  (Leave empty for 'Other')"}
                      />
                    )
                  }}
                </OData>
              </Col>
            </Row>
            <br />

            <Row>
              <Col md="12">
                <label style={{ fontWeight: "bold" }}>
                  7.5 If your Institution/Organisation is not in the list above, please type it here?
                </label>
                <TextInput
                  width="95%"
                  value={Q7_5}
                  callback={(value) => {
                    value = _gf.fixEmptyValue(value, "")
                    this.setState({ Q7_5: value })
                  }}
                />
              </Col>
            </Row>

            <Row>
              <Col md="4">
                <Button color="" style={{ marginLeft: "0px", backgroundColor: DEAGreen, color: "black", fontSize: "16px" }}
                  onClick={this.submit} >
                  <b>{editing === true ? "Update" : "Add"}</b>
                </Button>
              </Col>
            </Row>

            <Row style={{ marginTop: "15px" }}>
              <Col md="12">
                <label style={{ fontWeight: "bold", marginBottom: "0px", marginTop: "15px" }}>
                  Based on your submission, your Goal 7 status is:
                </label>
                <br />
                <Button
                  size="sm"
                  color=""
                  style={{ backgroundColor: Red, marginLeft: "0px", marginRight: "0px", height: goalStatus === "R" ? "40px" : "35px", width: goalStatus === "R" ? "58px" : "40px", border: goalStatus === "R" ? "2px solid black" : "0px solid black" }}
                />
                <Button
                  size="sm"
                  color=""
                  style={{ backgroundColor: Amber, marginLeft: "0px", marginRight: "0px", height: goalStatus === "A" ? "40px" : "35px", width: goalStatus === "A" ? "58px" : "40px", border: goalStatus === "A" ? "2px solid black" : "0px solid black" }}
                />
                <Button
                  size="sm"
                  color=""
                  style={{ backgroundColor: Green, marginLeft: "0px", marginRight: "0px", height: goalStatus === "G" ? "40px" : "35px", width: goalStatus === "G" ? "58px" : "40px", border: goalStatus === "G" ? "2px solid black" : "0px solid black" }}
                />
              </Col>
            </Row>

          </Col>
        </Row>

        {/* Message modal */}
        <Container>
          <Modal isOpen={this.state.messageModal} toggle={() => { this.setState({ messageModal: false }) }} centered>
            <ModalHeader toggle={() => { this.setState({ messageModal: false }) }}>
              {this.state.title}
            </ModalHeader>
            <ModalBody>
              <div className="col-md-12" style={{ overflowY: "auto", maxHeight: "65vh" }}>
                {_gf.StringToHTML(this.state.message)}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                size="sm"
                style={{ width: "100px", backgroundColor: DEAGreen }}
                color="" onClick={() => this.setState({ messageModal: false })} >
                Close
              </Button>
            </ModalFooter>
          </Modal>
        </Container>

      </>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Goal7Contrib)