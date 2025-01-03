import React from 'react';
import ListItem from './ListItem';
import '../css/ListContainer.css'

const ListContainer = ({
  listNumber,
  items,
  onMoveItem,
  arrowDirection,
  onMoveItemFromNewList,
  isNewList,
}) => {
  return (
    <div className='list-container'>
      <h3>List Number: {listNumber}</h3>
      <div>
        {items.map((item) => (
          <ListItem
            key={item.id}
            item={item}
            onMoveItem={() => onMoveItem(item, listNumber)}
            onMoveItemFromNewList={(direction) => onMoveItemFromNewList(item, direction)}
            arrowDirection={arrowDirection}
            isNewList={isNewList}
          />
        ))}
      </div>
    </div>
  );
};



export default ListContainer;
