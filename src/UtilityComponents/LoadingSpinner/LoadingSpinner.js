import React from 'react';
import './LoadingSpinner.css';

class LoadingSpinner extends React.Component {

    render() {
        if (this.props.loading)
            return (
                <div className="loading-container">
                    <div className="loading">
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