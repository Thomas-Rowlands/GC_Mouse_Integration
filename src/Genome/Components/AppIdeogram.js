import React, {Component} from "react";
import Ideogram from "ideogram";
import './AppIdeogram.css'

class AppIdeogram extends Component {

  componentDidMount() {
    return new Ideogram({
      organism: this.props.organism,
      container: '#ideo-container',
      chrHeight:600,
      chrWidth:15
    });
  }

  render() {
    return (
      <div id="ideo-container"/>
    );
  }
}

export default AppIdeogram