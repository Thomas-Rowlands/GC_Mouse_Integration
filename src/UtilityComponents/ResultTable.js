import React, {useCallback} from 'react';
import '../PhenotypeSearch/PhenotypeSearch.css';
import $ from 'jquery';

class ResultTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tableData: {}, onRowClick: null};
    }

    getPageControls(dataLength) {
        if (dataLength > 0) {
            return (
                <div className="row">
                    <div className="col">
                        <a className="table-prev btn btn-link disabled" id="prev_page_btn">&lt;- Previous Page</a>
                    </div>
                    <div className="col">
                        <span className="page-counter" id="pageNum">Page 1</span>
                    </div>
                    <div className="col">
                        <a className="table-next btn btn-link disabled" id="next_page_btn">Next Page -&gt;</a>
                    </div>
                </div>
            );
        }
    }


    render() {
        if (typeof this.props.tableData != "undefined" && this.props.tableData !== null)
            if (this.props.tableData.length > 0) {
                return (<div className="container">
                        {this.getPageControls(this.props.tableData.length)}
                        <br/>
                        <div className="info" id="searchResults">
                            <table>
                                <tbody>
                                <tr>
                                    {Object.keys(this.props.tableData[0]).map((header, index) => {
                                        return (<th key={index}>{header}</th>)
                                    })}
                                </tr>

                                {this.props.tableData.map((row, index) => {
                                  return (<tr data-id={row["ID"]} key={index} onClick={this.props.onRowClick}>
                                      {Object.keys(row).map((key) => {
                                          return (<td data-id={row["ID"]}>{row[key]}</td>)
                                      })}
                                  </tr>)
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div>
                        <br/>
                        <br/>
                        <p className="center">No results found.</p>
                    </div>
                );
            }
        else
            return null;

    }
}


export default ResultTable;