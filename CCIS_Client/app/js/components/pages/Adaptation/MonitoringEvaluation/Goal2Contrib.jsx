'use strict'

import React from 'react'
import { connect } from 'react-redux'
import { Row, Col, Button, Container, Modal, ModalHeader, ModalBody, ModalFooter, Input, InputRange } from 'mdbreact'
import TextInput from '../../../input/TextInput.jsx'
import { DEAGreen, DEAGreenDark, Red, Amber, Green } from '../../../../config/colours.cfg'
import { apiBaseURL, ccrdBaseURL, vmsBaseURL } from '../../../../config/serviceURLs.cfg'
import FileUpload from '../../../input/FileUpload.jsx'
import SelectInput from '../../../input/SelectInput.jsx'
import TreeSelectInput from '../../../input/TreeSelectInput.jsx'
import OData from 'react-odata'
import buildQuery from 'odata-query'

//Ant.D
import Slider from 'antd/lib/slider'
import 'antd/lib/slider/style/css'

//Images
import gear from '../../../../../images/gear.png'
import checklist from '../../../../../images/checklist.png'

//Content
import OrganogramTemplate from '../../../../../content/OrganogramTemplate.pptx'

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
  Q2_1: false, //DedicatedChampion
  Q2_1_A: "", //DocumentLink
  Q2_2: false, //DedicatedFunding
  Q2_2_A: 1, //TotalBudget
  Q2_2_B: 1, //FundingDuration
  Q2_2_C: 0, //FundingAgency
  Q2_2_D: 0, //PartneringDepartments
  Q2_3: 1, //IncludedInForums
  Q2_4: 0, //Region
  Q2_5: 0, //Institution
  Q2_6: "" //InstitutionCustom
}

class Goal2Contrib extends React.Component {

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

    let { goalStatus, Q2_1, Q2_1_A, Q2_2, Q2_3 } = this.state
    let newGoalStatus = "R"
    let redPoints = 0
    let amberPoints = 0
    let greenPoints = 0

    //Check red conditions
    if (Q2_1 === false) {
      redPoints += 1
    }
    if (Q2_2 === false) {
      redPoints += 1
    }
    if (Q2_3 === 1) {
      redPoints += 1
    }

    //Check amber conditions
    if (Q2_1 === true) {
      amberPoints += 1
    }
    if (Q2_3 === 2) {
      amberPoints += 1
    }

    //Check green conditions
    if (Q2_1 === true && !_gf.isEmptyValue(Q2_1_A)) {
      greenPoints += 1
    }
    if (Q2_2 === true) {
      greenPoints += 1
    }
    if (Q2_3 === 3) {
      greenPoints += 1
    }

    //Parse result to status colour    
    if (greenPoints === 3) {
      newGoalStatus = "G"
    }
    else if (redPoints <= 1 || amberPoints > 0) {
      newGoalStatus = "A"
    }
    else if (redPoints >= 2) {
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
          Q2_1: data.Questions.filter(x => x.Key === "DedicatedChampion")[0].Value === 'true',
          Q2_1_A: data.Questions.filter(x => x.Key === "DocumentLink")[0].Value,
          Q2_2: data.Questions.filter(x => x.Key === "DedicatedFunding")[0].Value === 'true',
          Q2_2_A: parseInt(data.Questions.filter(x => x.Key === "TotalBudget")[0].Value),
          Q2_2_B: parseInt(data.Questions.filter(x => x.Key === "FundingDuration")[0].Value),
          Q2_2_C: parseInt(data.Questions.filter(x => x.Key === "FundingAgency")[0].Value),
          Q2_2_D: data.Questions.filter(x => x.Key === "PartneringDepartments")[0].Value,
          Q2_3: parseInt(data.Questions.filter(x => x.Key === "IncludedInForums")[0].Value),
          Q2_4: parseInt(data.Questions.filter(x => x.Key === "Region")[0].Value),
          Q2_5: parseInt(data.Questions.filter(x => x.Key === "Institution")[0].Value),
          Q2_6: data.Questions.filter(x => x.Key === "InstitutionCustom")[0].Value
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

    let { goalId, goalStatus, Q2_1, Q2_1_A, Q2_2, Q2_2_A, Q2_2_B, Q2_2_C, Q2_2_D, Q2_3, Q2_4, Q2_5, Q2_6 } = this.state
    let { setLoading, user } = this.props

    setLoading(true)

    //Construct post body
    let goal = {
      Id: goalId,
      CreateUser: user.profile.UserId,
      Status: goalStatus,
      Type: 2,
      Questions: [
        { Key: "DedicatedChampion", Value: Q2_1.toString() },
        { Key: "DocumentLink", Value: Q2_1_A },
        { Key: "DedicatedFunding", Value: Q2_2.toString() },
        { Key: "TotalBudget", Value: Q2_2_A.toString() },
        { Key: "FundingDuration", Value: Q2_2_B.toString() },
        { Key: "FundingAgency", Value: Q2_2_C.toString() },
        { Key: "PartneringDepartments", Value: Q2_2_D },
        { Key: "IncludedInForums", Value: Q2_3.toString() },
        { Key: "Region", Value: Q2_4.toString() },
        { Key: "Institution", Value: Q2_5.toString() },
        { Key: "InstitutionCustom", Value: Q2_6 },
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

    let { editing, Q2_1, Q2_1_A, Q2_2, Q2_2_A, Q2_2_B, Q2_2_C, Q2_2_D, Q2_3, Q2_4, Q2_5, Q2_6, goalStatus, goalId } = this.state

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
              Goal 2. Appropriate resources (including current and past financial investments), capacity and
              processes (human, legal and regulatory) and support mechanisms (institutional and governance
              structures) to facilitate climate change adaptation.
            </h5>
            <p style={{ marginTop: "20px", marginBottom: "2px" }}>
              <b>What is being monitored and evaluated:</b>
            </p>
            <ol style={{ marginLeft: "-15px" }}>
              <li>
                Dedicated climate change champions/nodes/units and funding for businesses, sectors, provinces
                and municipalities (metropolitan, district and local);
              </li>
              <li>
                Climate change training programmes;
              </li>
              <li>
                Inclusion of climate change agendas in business, sectoral, provincial and municipal
                forums/committees (e.g. Climate Change Sustainability Councils, Municipal Climate Change
                Task Teams, Disaster Management Advisory Forums, Ward Councillor meetings, Provincial
                Cluster meetings, Board-level oversight);
              </li>
              <li>
                Implementation of forum/committee climate change action plans; and
              </li>
              <li>
                Dedicated budget/funding (including monetary incentives).
              </li>
            </ol>
            <p style={{ marginBottom: "3px" }}>
              <b>How it is being evaluated:</b>
            </p>
            <table style={{ width: "95%" }}>
              <tbody>
                <tr style={{ backgroundColor: Red }}>
                  <td style={{ color: "white", padding: "10px" }}>
                    <p style={{ marginBottom: "0px" }}>
                      <b>RED </b>
                      No dedicated political/administrative champions, capacity, structure (i.e.
                      organogram with climate change key performance indicators or Board-level
                      oversight of climate change) or funding (including monetary incentives);
                      no inclusion of climate change items in existing administrative and
                      political forums/committees in businesses, sectors, provinces and municipalities.
                    </p>
                  </td>
                </tr>
                <tr style={{ backgroundColor: Amber }}>
                  <td style={{ color: "white", padding: "10px" }}>
                    <p style={{ marginBottom: "0px" }}>
                      <b>AMBER </b>
                      Political/administrative champions designated but with no capacity, structure
                      (i.e. organogram) or funding; inclusion of climate change items only by request
                      in existing administrative and political forums/committees.
                    </p>
                  </td>
                </tr>
                <tr style={{ backgroundColor: Green }}>
                  <td style={{ color: "white", padding: "10px" }}>
                    <p style={{ marginBottom: "0px" }}>
                      <b>GREEN </b>
                      Political/administrative champions designated, and capacity, structure
                      (i.e. organogram/Board-level oversight) and dedicated funding; climate change
                      standing item in administrative and political provincial, municipal and sector
                      forum/committee agendas.
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
              Goal 2 Assessment
            </h5>
            <br />

            <Row>
              <Col md="12">
                <label style={{ fontWeight: "bold", marginBottom: "0px", marginRight: "7px" }}>
                  2.1 Does organisation have a dedicated political/administrative champion with capacity and structure?
                </label>
                <br />
                <div>
                  <Button
                    onClick={() => { this.setState({ Q2_1: true }) }}
                    color=""
                    style={{ fontSize: Q2_1 ? "13px" : "10px", marginLeft: "0px", backgroundColor: Q2_1 ? DEAGreen : "grey" }}
                    size="sm">
                    YES
                  </Button>
                  <Button
                    onClick={() => { this.setState({ Q2_1: false }) }}
                    color=""
                    style={{ fontSize: !Q2_1 ? "13px" : "10px", backgroundColor: !Q2_1 ? DEAGreen : "grey" }}
                    size="sm">
                    NO
                </Button>
                </div>
              </Col>
            </Row>
            <br />

            <Row style={{ marginBottom: "7px" }}>
              <Col md="12">
                <label style={{ fontWeight: "bold" }}>
                  Attach your organogram:
                </label>
                <br />
                <a href={OrganogramTemplate}>
                  <p style={{ fontSize: "14px", marginTop: "-8px", marginBottom: "35px" }}>
                    <u>Download Organogram Template</u>
                  </p>
                </a>
                <TextInput
                  width="95%"
                  value={Q2_1_A}
                  callback={(value) => {
                    value = _gf.fixEmptyValue(value, "")
                    this.setState({ Q2_1_A: value })
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
                  callback={(fileInfo) => { this.setState({ Q2_1_A: fileInfo.ViewLink }) }}
                  goalId={goalId}
                />
              </Col>
            </Row>

            <Row>
              <Col md="12">
                <label style={{ fontWeight: "bold", marginBottom: "0px" }}>
                  2.2 Does your climate change unit have dedicated funding?
                </label>
                <br />
                <Button
                  onClick={() => { this.setState({ Q2_2: true }) }}
                  color=""
                  style={{ fontSize: Q2_2 ? "13px" : "10px", marginLeft: "0px", backgroundColor: Q2_2 ? DEAGreen : "grey" }}
                  size="sm">
                  YES
                </Button>
                <Button
                  onClick={() => { this.setState({ Q2_2: false }) }}
                  color=""
                  style={{ fontSize: !Q2_2 ? "13px" : "10px", backgroundColor: !Q2_2 ? DEAGreen : "grey" }}
                  size="sm">
                  NO
                </Button>
              </Col>
            </Row>
            <br />

            <Row style={{ marginBottom: "7px", marginLeft: "0px" }}>
              <Col md="12">
                <label style={{ fontWeight: "bold" }}>
                  What is the total budget?
                </label>
                <div style={{ backgroundColor: "#FCFCFC", padding: "10px 15px 5px 15px", borderRadius: "5px", border: "1px solid lightgrey" }} >
                  <Row style={{ marginBottom: "-10px" }}>
                    <Col md="2" style={{ textAlign: "left" }}>
                      <a onClick={() => { this.setState({ Q2_2_A: 1 }) }}>1k - 10k</a>
                    </Col>
                    <Col md="2" style={{ textAlign: "left" }}>
                      <a onClick={() => { this.setState({ Q2_2_A: 2 }) }}>10k - 100k</a>
                    </Col>
                    <Col md="2" style={{ textAlign: "center" }}>
                      <a onClick={() => { this.setState({ Q2_2_A: 3 }) }}>100k - 1m</a>
                    </Col>
                    <Col md="2" style={{ textAlign: "center" }}>
                      <a onClick={() => { this.setState({ Q2_2_A: 4 }) }}>1m - 10m</a>
                    </Col>
                    <Col md="2" style={{ textAlign: "right" }}>
                      <a onClick={() => { this.setState({ Q2_2_A: 5 }) }}>10m - 100m</a>
                    </Col>
                    <Col md="2" style={{ textAlign: "right" }}>
                      <a onClick={() => { this.setState({ Q2_2_A: 6 }) }}>> 100m</a>
                    </Col>
                  </Row>
                  <Slider
                    min={1}
                    max={6}
                    value={Q2_2_A}
                    style={{ marginLeft: "15px", marginRight: "15px" }}
                    onChange={(value) => { this.setState({ Q2_2_A: value }) }}
                  />
                </div>
              </Col>
            </Row>
            <br />

            <Row style={{ marginBottom: "7px", marginLeft: "0px" }}>
              <Col md="5">
                <label style={{ fontWeight: "bold" }}>
                  How long will the funding last? (Years)
                </label>
                <div style={{ backgroundColor: "#FCFCFC", padding: "10px 15px 5px 15px", borderRadius: "5px", border: "1px solid lightgrey" }} >
                  <Row style={{ marginBottom: "-10px" }}>
                    <Col md="4" style={{ textAlign: "left" }}>
                      <a onClick={() => { this.setState({ Q2_2_B: 1 }) }}>1 - 5</a>
                    </Col>
                    <Col md="4" style={{ textAlign: "center" }}>
                      <a onClick={() => { this.setState({ Q2_2_B: 2 }) }}>5 - 10</a>
                    </Col>
                    <Col md="4" style={{ textAlign: "right" }}>
                      <a onClick={() => { this.setState({ Q2_2_B: 3 }) }}>> 10</a>
                    </Col>
                  </Row>
                  <Slider
                    min={1}
                    max={3}
                    value={Q2_2_B}
                    style={{ marginLeft: "15px", marginRight: "15px" }}
                    onChange={(value) => { this.setState({ Q2_2_B: value }) }}
                  />
                </div>
              </Col>
            </Row>
            <br />

            <Row style={{ marginBottom: "7px", marginLeft: "0px" }}>
              <Col md="8">
                <label style={{ fontWeight: "bold" }}>
                  Who is the funding agency?
                </label>

                <OData
                  baseUrl={ccrdBaseURL + 'Funders'}
                  query={{
                    select: ['FunderId', 'FundingAgency'],
                    orderBy: ['FundingAgency']
                  }}>

                  {({ loading, error, data }) => {

                    let processedData = []

                    if (loading) {
                      processedData = [{ FunderId: "Loading...", FundingAgency: "Loading..." }]
                    }

                    if (error) {
                      console.error(error)
                    }

                    if (data) {
                      if (data.value && data.value.length > 0) {
                        processedData = data.value
                      }
                    }

                    return (
                      <TreeSelectInput
                        data={processedData}
                        transform={(item) => { return { id: item.FunderId, text: item.FundingAgency } }}
                        value={Q2_2_C}
                        callback={(value) => { this.setState({ Q2_2_C: value.id }) }}
                        allowClear={true}
                        placeHolder={"Select Funding Agency...  (Leave empty for 'None')"}
                      />
                    )
                  }}
                </OData>
              </Col>
            </Row>
            <br />

            <Row style={{ marginBottom: "7px", marginLeft: "0px" }}>
              <Col md="8">
                <label style={{ fontWeight: "bold" }}>
                  Are there any partnering departments/organisations that share the costs?
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
                        value={Q2_2_D}
                        callback={(value) => { this.setState({ Q2_2_D: value.id }) }}
                        allowClear={true}
                        placeHolder={"Select Departments/Organisations...  (Leave empty for 'None')"}
                      />
                    )
                  }}
                </OData>
              </Col>
            </Row>
            <br />

            <Row style={{ marginBottom: "15px" }}>
              <Col md="12">
                <label style={{ fontWeight: "bold" }}>
                  2.3 Are climate change items included in existing administrative and political
                  forums/committees in businesses, sectors, provinces and municipalities?
                </label>
                <div style={{ marginLeft: "-22px", marginTop: "-10px" }}>
                  <Input
                    onClick={() => { this.setState({ Q2_3: 1 }) }}
                    checked={Q2_3 === 1 ? true : false}
                    label="No."
                    type="radio"
                    id="radFC1"
                  />
                  <Input
                    onClick={() => { this.setState({ Q2_3: 2 }) }}
                    checked={Q2_3 === 2 ? true : false}
                    label="Only by request in existing administrative and political forums/committees."
                    type="radio"
                    id="radFC2"
                  />
                  <Input
                    onClick={() => { this.setState({ Q2_3: 3 }) }}
                    checked={Q2_3 === 3 ? true : false}
                    label="Climate change in a standing item in administrative and political provincial, municipal and sector forum/committee agendas."
                    type="radio"
                    id="radFC3"
                  />
                </div>
              </Col>
            </Row>

            <Row>
              <Col md="8">
                <label style={{ fontWeight: "bold" }}>
                  2.4 Select a Region for this plan?
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
                        value={Q2_4}
                        callback={(value) => { this.setState({ Q2_4: value.id }) }}
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
                  2.5 Select your Institution/Organisation?
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
                        value={Q2_5}
                        callback={(value) => { this.setState({ Q2_5: value.id }) }}
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
                  2.6 If your Institution/Organisation is not in the list above, please type it here?
                </label>
                <TextInput
                  width="95%"
                  value={Q2_6}
                  callback={(value) => {
                    value = _gf.fixEmptyValue(value, "")
                    this.setState({ Q2_6: value })
                  }}
                />
              </Col>
            </Row>

            <Row>
              <Col md="4">
                <Button
                  color=""
                  style={{
                    marginLeft: "0px",
                    marginTop: "15px",
                    backgroundColor: DEAGreen,
                    color: "black",
                    fontSize: "16px"
                  }}
                  onClick={this.submit} >
                  <b>{editing === true ? "Update" : "Add"}</b>
                </Button>
              </Col>
            </Row>

            <Row style={{ marginTop: "15px" }}>
              <Col md="12">
                <label style={{ fontWeight: "bold", marginBottom: "0px" }}>
                  Based on your submission, your Goal 2 status is:
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

export default connect(mapStateToProps, mapDispatchToProps)(Goal2Contrib)