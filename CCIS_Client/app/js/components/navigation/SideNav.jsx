'use strict'

import React from 'react'
import { connect } from 'react-redux';
import {
  SideNav as MSBSideNav, Fa, SideNavItem, SideNavCat, SideNavNav, SideNavLink, Container, Row, Button,
  Modal, ModalBody, ModalHeader, ModalFooter
} from 'mdbreact'
import { DEAGreen } from '../../config/colours.cfg'
import TreeInput from '../input/TreeInput.jsx'

import '../../../css/mdbreact-sidenav.css'
import loader from '../../../images/ajax-loader.gif'

const mapStateToProps = (state, props) => {
  return {}
}

const mapDispatchToProps = (dispatch) => {
  return {
    toggleSideNav: payload => {
      dispatch({ type: "TOGGLE_SIDENAV", payload })
    }
  }
}

class SideNav extends React.Component {

  constructor(props) {
    super(props)

    this.renderLinks = this.renderLinks.bind(this)
    this.toggleNav = this.toggleNav.bind(this)
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    this.showContent = this.showContent.bind(this);

    this.state = { navOpen: [], width: 0, height: 0, showContent: false, contentLink: "", contentTitle: "" }
  }

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  updateWindowDimensions() {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  }

  toggleNav(key) {

    let { navOpen } = this.state

    if (navOpen.includes(key)) {
      navOpen = navOpen.filter(x => x !== key)
    }
    else {
      navOpen.push(key)
    }

    this.setState({ navOpen })
  }

  renderLinks(data, level = 0) {

    let { navOpen } = this.state
    let links = []
    //let indent = (level > 1 ? 26 * (level - 1) : 0) + "px"

    data.forEach(x => {

      if (typeof x.children !== 'undefined') {
        links.push(
          <SideNavCat
            id={"cat_" + x.id}
            key={"cat_" + x.id}
            name={x.text + " "}
            icon="chevron-right"
          >
            {this.renderLinks(x.children, level + 1)}
          </SideNavCat>
        )
      }
      else {
        if (typeof x.link !== 'undefined') {
          links.push(
            <SideNavItem
              key={"lnk_" + x.id}
              onClick={() => {
                this.showContent(x.link, x.text)
              }}
            >
              <Fa style={{ marginRight: "10px" }} icon="link" />
              {x.text}
            </SideNavItem>
          )
        }
        else {
          links.push(
            <SideNavItem
              key={"lnk_" + x.id}
            >
              <Fa style={{ marginRight: "10px" }} icon="unlink" />
              {x.text}
            </SideNavItem>
          )
        }
      }
    })

    return links
  }

  closeModal() {
    this.setState({ showContent: false })
    //this.props.toggleSideNav(false)
  }

  showContent(link, title) {
    this.setState({ showContent: true, contentLink: link, contentTitle: title })
  }

  render() {

    let { isOpen, title, data } = this.props
    let { width, height, showContent, contentLink, contentTitle } = this.state

    const sideNavWidth = 315

    return (
      <>

        <MSBSideNav hidden triggerOpening={isOpen} breakWidth={1300} className="white side-nav-light">

          <div className="text-center" style={{ color: "black", marginBottom: "-5px" }}>
            {data.logoTop &&
              <img src={data.logoTop.src} style={{ width: data.logoTop.width, marginTop: "15px" }} />
            }
            <hr />
            <h4>{data.title}</h4>
            <hr />
          </div>

          <SideNavNav>
            {this.renderLinks(data.nav)}
          </SideNavNav>

          <hr />
          <div className="text-center">
            {data.logoBottom &&
              <img src={data.logoBottom.src} style={{ width: data.logoBottom.width }} />
            }
          </div>

        </MSBSideNav>

        <Modal
          isOpen={showContent}
          toggle={() => this.closeModal()}
          style={{ width: (width - sideNavWidth - 5) + "px" }}
          size="fluid"
          fullHeight position="right"
        >
          <ModalHeader toggle={() => this.closeModal()}>
            {contentTitle}
          </ModalHeader>
          <ModalBody>
            <iframe
              style={{
                marginLeft: "-15px",
                marginRight: "0px",
                marginTop: "-15px",
                marginBottom: "-20px",
                width: (width - sideNavWidth - 5) + "px",
                height: (height - 75) + "px",
                border: "0px solid black",
                backgroundImage: `url(${loader})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "50% 50%"
              }}
              src={contentLink}
            />
          </ModalBody>
        </Modal>
      </>
    )
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(SideNav)