import React, { useState, useEffect } from 'react';
import ListContainer from '../components/ListContainer';
import '../css/HomePage.css'

const HomePage = () => {
  const [lists, setLists] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedLists, setSelectedLists] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListKey, setNewListKey] = useState(null);
  const [newListItems, setNewListItems] = useState([]);
  const [initialLists, setInitialLists] = useState({});
  const [history, setHistory] = useState([]);

  // Fetching data from the API
  const fetchListData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await fetch('https://apis.ccbp.in/list-creation/lists');
      if (!response.ok) {
        throw new Error('Failed to fetch lists');
      }
      const data = await response.json();
      if (Array.isArray(data.lists)) {
        organizeListsByNumber(data.lists);
      } else {
        throw new Error('Unexpected data format');
      }
    } catch (error) {
      console.error(error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Organizing lists based on list_number
  const organizeListsByNumber = (items) => {
    const organizedLists = {};
    items.forEach((item) => {
      const { list_number } = item;
      if (!organizedLists[list_number]) {
        organizedLists[list_number] = [];
      }
      organizedLists[list_number].push(item);
    });
    setLists(organizedLists);
    setInitialLists(organizedLists);
  };

  const handleSelectList = (listNumber, isChecked) => {
    if (isChecked) {
      setSelectedLists((prevSelectedLists) => [...prevSelectedLists, listNumber]);
    } else {
      setSelectedLists((prevSelectedLists) =>
        prevSelectedLists.filter((list) => list !== listNumber)
      );
    }
  };

  const handleCreateNewList = () => {
    if (selectedLists.length !== 2) {
      setErrorMessage('You should select exactly 2 lists to create a new list');
    } else {
      setErrorMessage('');
      setIsCreatingList(true);
      setHistory((prevHistory) => [...prevHistory, { ...lists }]);

      // Dynamically determine the next list number
      const nextListNumber = Math.max(...Object.keys(lists).map(Number)) + 1;
      setNewListKey(nextListNumber); // Set the next list number
      setNewListItems([]);
    }
  };

  const handleMoveToNewList = (item, fromListNumber) => {
    // Move item from source list (fromListNumber) to new list
    setNewListItems((prevNewListItems) => {
      const alreadyExists = prevNewListItems.some((newItem) => newItem.id === item.id);
      if (alreadyExists) return prevNewListItems;
      return [...prevNewListItems, item];
    });

    // Use the common function to remove the item from the original list
    moveItemBetweenLists(item, fromListNumber, newListKey);
  };


  const handleMoveFromNewList = (item, direction) => {
    // Determine the target list based on the direction ('left' or 'right')
    const targetListNumber = direction === 'left' ? selectedLists[0] : selectedLists[1];
    console.log("direction", direction)

    // Remove item from the new list and move it to the selected list
    setNewListItems((prevNewListItems) =>
      prevNewListItems.filter((listItem) => listItem.id !== item.id)
    );

    // Use the common function to move the item to the target list
    moveItemBetweenLists(item, newListKey, targetListNumber);
  };


  const moveItemBetweenLists = (item, sourceListNumber, targetListNumber) => {
    if (!sourceListNumber || !targetListNumber) {
      console.error("Invalid source or target list number");
      return;
    }

    // Remove item from the source list
    setLists((prevLists) => {
      const updatedLists = { ...prevLists };

      // Remove item from source list
      updatedLists[sourceListNumber] = updatedLists[sourceListNumber].filter(
        (listItem) => listItem.id !== item.id
      );

      // Ensure the target list exists, else initialize as empty
      if (!Array.isArray(updatedLists[targetListNumber])) {
        updatedLists[targetListNumber] = [];
      }

      // Add item to target list
      updatedLists[targetListNumber] = [...updatedLists[targetListNumber], item];

      return updatedLists;
    });
  };

  const handleCancel = () => {
    if (history.length > 0) {
      // Revert to the last valid state in history
      const lastState = history[history.length - 1];
      setLists(lastState); // Restore previous state
      setHistory(history.slice(0, -1)); // Remove the last state from history
    } else {
      // Fallback to initial state if no history
      setLists(initialLists);
    }

    setIsCreatingList(false);
    setNewListKey(null); // Clear the new list key
    setNewListItems([]);
    setSelectedLists([]);

  };

  const handleUpdate = () => {
    setIsCreatingList(false);
    setSelectedLists([]);
    setNewListKey(null); // Reset new list key after update
  };

  useEffect(() => {
    fetchListData();
  }, []);

  const renderLists = () => {
    return Object.keys(lists).map((listNumber) => (
      <div className="list-wrapper" key={listNumber}>
        <div className='checkbox-container'>
          <label>
            <input
              type="checkbox"
              checked={selectedLists.includes(Number(listNumber))}
              onChange={(e) => handleSelectList(Number(listNumber), e.target.checked)}
            />
            List {listNumber}
          </label>
        </div>
        <ListContainer
          listNumber={listNumber}
          items={lists[listNumber]}
          onMoveItem={isCreatingList ? handleMoveToNewList : null}
          arrowDirection={null}
        />
      </div>
    ));
  };

  return (
    <div>
      {isLoading ? (
        <>
          <style>{loaderAnimation}</style>
          <div className='loader'></div>
        </>
      ) : (
        <>
          {hasError ? (
            <div className='error-container'>
              <img
                src="/list-creation-failure-lg-output.png"
                alt="Error"
                className='error-image'
              />
              <p>Failed to load the lists. Please try again.</p>
              <button className="button" onClick={fetchListData}>Try Again</button>
            </div>
          ) : (
            <>
              <b><h2>List Creation</h2></b>
              {!isCreatingList && (
                <button
                  className="button"
                  onClick={handleCreateNewList}
                >
                  <span className='icon'>&#43;</span> Create a New List
                </button>
              )}
              {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

              {/* <div style={containerStyle}>{renderLists()}</div> */}
              {!isLoading && !hasError && !isCreatingList && (
                <div className='container'>{renderLists()}</div>
              )}

              {isCreatingList && (
                <div>
                  <div className='container'>
                    <ListContainer
                      listNumber={selectedLists[0]}
                      items={lists[selectedLists[0]]}
                      onMoveItem={handleMoveToNewList}
                      arrowDirection="right"
                    />
                    <ListContainer
                      listNumber={newListKey}
                      items={newListItems}
                      onMoveItemFromNewList={handleMoveFromNewList}
                      selectedLists={selectedLists}
                      isNewList
                    />
                    <ListContainer
                      listNumber={selectedLists[1]}
                      items={lists[selectedLists[1]]}
                      onMoveItem={handleMoveToNewList}
                      arrowDirection="left"
                    />
                  </div>
                  <div className="button-container">
                    <button
                      onClick={handleUpdate}
                      className="button"
                      style={{ backgroundColor: '#4CAF50' }}
                    >
                      <span className='icon'>✓</span> Update
                    </button>

                    <button
                      onClick={handleCancel}
                      className="button"
                      style={{ backgroundColor: '#f44336' }}
                    >
                      <span className='icon'>✖</span> Cancel
                    </button>
                  </div>

                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );


};

const loaderAnimation = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;




export default HomePage;
