import React, {Component} from "react";
import Ideogram from "ideogram";

class AppIdeogram extends Component {

  componentDidMount() {
    return new Ideogram({
      organism: 'human',
      container: '#ideo-container'
    });
  }

  render() {
    return (
      <div id="ideo-container"></div>
    );
  }
}

export default AppIdeogram