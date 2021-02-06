import React, {useCallback} from 'react';
import '../App.css';
import {useHistory} from 'react-router-dom';

class MainMenuItem extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (<div className="menu-option">
            <div>
                <img src={this.props.image} alt={this.props.alt}/>
                <span>{this.props.heading}</span>
                <p>{this.props.body}</p>
            </div>
        </div>);
    }
}

export default MainMenuItem;