import React from "react";

interface ListFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

// This is a functional component that renders a list of categories 
const ListFilter = ({ categories, selectedCategory, onCategorySelect }: ListFilterProps) => {
  return (
    <ul className="list-group">
      {categories.map((category) => (
        <li
          onClick={() => onCategorySelect(category)}
          key={category}
          className={
            category === selectedCategory
              ? "list-group-item active"
              : "list-group-item"
          }
        >
          {category}
        </li>
      ))}
    </ul>
  );
};

export default ListFilter;
