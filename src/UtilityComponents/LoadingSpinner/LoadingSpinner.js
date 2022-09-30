import React from 'react';
import './LoadingSpinner.css';

class LoadingSpinner extends React.Component {

    render() {
        if (this.props.loading)
            return (
                <div style={{position: this.props.isRelative ? "relative" : "absolute"}} className="loading-container">
                    <div style={{marginTop: this.props.isRelative ? "5%" : "10%",
                    marginBottom: this.props.isRelative ? "5%" : "none"}} className="loading">
                        <div className="loader">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>
                        <h4>Loading...</h4>
                    </div>
                </div>
            );
        else
            return (null);
    }
}

export default LoadingSpinner;