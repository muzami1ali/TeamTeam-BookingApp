import React, { Component } from "react";
import Pagination from "../common/Pagination";
import { paginate } from "../../utils/paginate";
import SearchBar from "../common/Searchbar";
import { Link } from "react-router-dom";
import ListFilter from "../common/ListFilter";
import axios from "axios";
import "../../styles/index.css";
import { number } from "yup";

// This is a class component that renders a list of societies
class SearchSocieties extends Component {
  state: {
    societiesList: any[];
    currentPage: number;
    pageSize: number;
    selectedCategory: any;
    searchQuery: string;
  };
  constructor(props:any) {
    super(props);
    this.state = {
      societiesList: [],
      currentPage: 1,
      pageSize: 5,
      selectedCategory: null,
      searchQuery: "",
    };
  }

  async componentDidMount() {
    const { data: societiesList } = await axios.get(
      process.env.REACT_APP_API_URL + "/societies/getSocieties"
    );
    this.setState({ societiesList });
  }

  handlePageChange = (page:number) => {
    this.setState({ currentPage: page });
  };

  handleSearch = (query:string) => {
    this.setState({
      searchQuery: query,
      currentPage: 1,
      selectedCategory: null,
    });
  };

  handleCategorySelect = (category:any) => {
    this.setState({
      selectedCategory: category,
      currentPage: 1,
      searchQuery: "",
    });
  };

  render() {
    const { pageSize, currentPage, selectedCategory } = this.state;

    let filtered = this.state.societiesList;

    // Filter societies by search query
    if (this.state.searchQuery) {
      filtered = this.state.societiesList.filter((society) =>
        society.name
          .toLowerCase()
          .startsWith(this.state.searchQuery.toLowerCase())
      );
      // Filter societies by category
    } else if (selectedCategory && selectedCategory !== "All") {
      filtered = this.state.societiesList.filter(
        (society) => society.category === selectedCategory
      );
    } else {
      filtered = this.state.societiesList;
    }

    const societies = paginate(filtered, currentPage, pageSize);

    return (
      <div className="page-container">
        <div className="underlay"></div>
        <div className="searchSocietiesPage-container">
          <h1>Societies</h1>
          <div data-testid="searchbar">
            <SearchBar
              value={this.state.searchQuery}
              onChange={this.handleSearch}
            />
          </div>
          <ListFilter
            categories={["All", "Sports", "Academic", "Social", "Other"]}
            selectedCategory={this.state.selectedCategory}
            onCategorySelect={this.handleCategorySelect}
          />

          <table className="societyListTable">
            <tbody>
              {societies.map((society) => (
                <Link to={`/society/${society.id}`}>
                  <tr key={society.id}>
                    <div className="icon">
                      <div
                        className="logo"
                        style={{
                          backgroundImage: `url(${society.links[0].logo})`,
                        }}
                      ></div>
                    </div>
                    <div className="name">{society.name}</div>
                    <div className="category">
                      {society.members} Followers - {society.category}
                    </div>
                    <div className="description">{society.description}</div>
                    <div className="followers"></div>
                  </tr>
                </Link>
              ))}
            </tbody>
          </table>

          <div data-testid="pagination">
            <Pagination
              itemsCount={filtered.length}
              pageSize={this.state.pageSize}
              currentPage={this.state.currentPage}
              onPageChange={this.handlePageChange}
            />
          </div>
          <Link to="/create-society">
            <button className="button" style={{ marginRight: "15px" }}>
              Create Society
            </button>
          </Link>
        </div>
      </div>
    );
  }
}

export default SearchSocieties;
