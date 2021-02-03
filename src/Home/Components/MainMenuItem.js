import React, {useCallback} from 'react';
import '../App.css';
import {useHistory} from 'react-router-dom';

class MainMenuItem extends React.Component {
    const history = useHistory();

    constructor(props) {
        super(props);
    }

    navigate() {
        this.props.history.push(this.props.url);
    }

    render() {
        return (<div className="menu-option" onClick={this.navigate}>
            <div>
                <img src={this.props.image} alt={this.props.alt}/>
                <span>{this.props.heading}</span>
                <p>{this.props.body}</p>
            </div>
        </div>);
    }
}

export default MainMenuItem;