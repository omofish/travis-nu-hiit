import React, { useEffect, useState } from "react";
import "semantic-ui-css/semantic.min.css";
import "firebase/database";
import 'firebase/auth';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import {
  Card,
  Image,
  Header,
  Sidebar,
  Button,
  Menu,
  Segment,
  Icon,
  Container,
  Message,
  Dimmer
} from "semantic-ui-react";
import { to2DP } from "./components/utils";

const firebaseConfig = {
  apiKey: "AIzaSyCS2_eO1zh7jR3yOGbC9aeOcLEze5jppOw",
  authDomain: "new-shopping-cart-216ac.firebaseapp.com",
  databaseURL: "https://new-shopping-cart-216ac.firebaseio.com",
  projectId: "new-shopping-cart-216ac",
  storageBucket: "new-shopping-cart-216ac.appspot.com",
  messagingSenderId: "67349935504",
  appId: "1:67349935504:web:2213ff7b84f54ad80aaf15"
};

firebase.initializeApp(firebaseConfig);
const inventoryDB2 = firebase.database().ref();

const uiConfig = {
  signInFlow: 'popup',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: () => false
  }
};

const fixedOverlayStyle = {
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  position: "fixed",
  margin: "10px",
  zIndex: 10
};

const App = () => {
  const [data, setData] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const products = Object.values(data);
  const [cartItems, setCartItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [user, setUser] = useState(null);


  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch("./data/products.json");
      const json = await response.json();
      setData(json);
      // setCartItems([
      //   { sku: "12064273040195392", price: 10.9, size: "M", quantity: 2 },
      //   { sku: "51498472915966370", price: 29.45, size: "M", quantity: 1 }
      // ]);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    firebase.auth().onAuthStateChanged(setUser);
  }, []);

  useEffect(() => {
    const handleData = snap => {
      if (snap.val()) setInventory(snap.val());
    };
    inventoryDB2.on("value", handleData, error => alert(error));
    return () => {
      inventoryDB2.off("value", handleData);
    };
  });

  return (
    <Sidebar.Pushable as={Segment}>
      <Banner user={ user } />
      <Sidebar
        width="very wide"
        animation="push"
        icon="labeled"
        visible={cartOpen}
      >
        <ShoppingCart
          state={{ cartItems, setCartItems }}
          data={data}
          inventoryState={{ inventory, setInventory }}
        />
      </Sidebar>

      <Sidebar.Pusher>
        <Menu style={fixedOverlayStyle} borderless>
          <Menu.Item>
            <CartButton state={{ cartOpen, setCartOpen }} />
          </Menu.Item>
        </Menu>
        <Container>
          <Segment>
            <Catalog
              products={products}
              state={{ cartItems, setCartItems }}
              cartOpenState={{ cartOpen, setCartOpen }}
              inventoryState={{ inventory, setInventory }}
            />
          </Segment>
        </Container>
      </Sidebar.Pusher>
    </Sidebar.Pushable>
  );
};

const Banner = ({ user, title }) => (
  <React.Fragment>
    { user ? <Welcome user={ user } /> : <SignIn /> }
  </React.Fragment>
);

const SignIn = () => (
  <StyledFirebaseAuth
    uiConfig={uiConfig}
    firebaseAuth={firebase.auth()}
  />
);


const Welcome = ({ user }) => (
  <Message color="info">
    <Segment basic compact clearing as={Message.Header} >
      Welcome, {user.displayName}
      <Button floated="right" primary onClick={() => firebase.auth().signOut()}>
        Log out
      </Button>
    </Segment>
  </Message>
);



const Catalog = ({ products, state, cartOpenState, inventoryState }) => (
  <Card.Group centered itemsPerRow="4" stackable>
    {products.map(product => (
      <Product
        key={product.sku}
        product={product}
        state={state}
        cartOpenState={cartOpenState}
        inventoryState={inventoryState}
      />
    ))}
  </Card.Group>
);

const Product = ({ product, state, cartOpenState, inventoryState }) => {
  const imageURL = "data/products/" + product.sku + "_2.jpg";
  const price = "$" + to2DP(product.price);

  let productAvailable = false;

  const totalProductsInCart = state.cartItems.filter(
    x => x.sku === product.sku
  );

  if (typeof inventoryState.inventory[product.sku] !== "undefined") {
    if (totalProductsInCart.length >= 0) {
      const totalProductsCount = totalProductsInCart.map(x => x.quantity);
      console.log(totalProductsCount);
      
      if (
        Object.values(inventoryState.inventory[product.sku]).reduce(
          (a, b) => a + b,
          0
        ) > Object.values(totalProductsCount).reduce(
          (a, b) => a + b,
          0
        )
      )
        productAvailable = true;
    }
  }

  return (
    <Dimmer.Dimmable as={Card}>
      <Image src={imageURL} wrapped ui={false} />
      <Card.Content>
        <Card.Header textAlign="center">{product.title}</Card.Header>
        <Card.Meta textAlign="center">{product.style}</Card.Meta>
      </Card.Content>
      <Card.Content extra>
        <Header textAlign="center">{price}</Header>
        <SizeButtons
          product={product}
          state={state}
          cartOpenState={cartOpenState}
          inventoryState={inventoryState}
        />
      </Card.Content>

      <Dimmer active={!productAvailable}>
        <Header as="h2" icon inverted>
          <Icon name="remove" />
          Out of Stock
        </Header>
      </Dimmer>
    </Dimmer.Dimmable>
  );
};

const sizes = {
  S: "Small",
  M: "Medium",
  L: "Large",
  XL: "Extra Large"
};

const SizeButtons = ({ product, state, cartOpenState, inventoryState }) => (
  <Button.Group fluid>
    {Object.keys(sizes).map(size => {
      let available = false;

      const currentItem = state.cartItems.filter(
        x => x.sku === product.sku && x.size === size
      )[0];

      const currentQty =
        typeof currentItem === "undefined" ? 0 : currentItem.quantity;

      if (typeof inventoryState.inventory[product.sku] !== "undefined") {
        if (inventoryState.inventory[product.sku][size] - currentQty > 0)
          available = true;
      }

      return (
        <Button
          key={size}
          positive={available}
          disabled={!available}
          onClick={() => {
            let match = false;
            const newCartItems = state.cartItems.map(item => {
              if (item.sku === product.sku && item.size === size) {
                item.quantity++;
                match = true;
                return item;
              } else return item;
            });
            state.setCartItems(newCartItems);
            // if none are found to be the same, create new entry
            if (!match) {
              const newItem = {
                sku: product.sku,
                price: product.price,
                size: size,
                quantity: 1
              };
              state.setCartItems(state.cartItems.concat([newItem]));
            }
            cartOpenState.setCartOpen(true);
          }}
        >
          {size}
        </Button>
      );
    })}
  </Button.Group>
);

const CartButton = ({ state }) => (
  <Button
    toggle
    active={!state.cartOpen}
    size="huge"
    icon
    labelPosition="left"
    onClick={() => state.setCartOpen(!state.cartOpen)}
  >
    <Icon name={state.cartOpen ? "x" : "shopping cart"} />
    Cart
  </Button>
);

const ShoppingCart = ({ state, data, inventoryState }) => {
  return (
    <Segment.Group>
      <Segment>
        <Header>Shopping Cart</Header>
      </Segment>
      <Segment>
        <Card.Group itemsPerRow="1">
          {state.cartItems.map(item => (
            <CartItem
              key={item.sku + item.size}
              item={item}
              state={state}
              product={data[item.sku]}
              inventoryState={inventoryState}
            />
          ))}
        </Card.Group>
      </Segment>
      <Segment attached="bottom" clearing>
        <Header size="large">Total Cost</Header>
        <Header>
          <TotalCost cartItems={state.cartItems} />
        </Header>
        <Button floated="right" positive>
          Checkout
        </Button>
      </Segment>
    </Segment.Group>
  );
};

const CartItem = ({ item, product, state, inventoryState }) => {
  const imageURL = "data/products/" + product.sku + "_2.jpg";
  const priceDisp = "$" + to2DP(item.price);
  const stockAvailable =
    inventoryState.inventory[item.sku][item.size] - item.quantity > 0
      ? true
      : false;

  return (
    <Card>
      <Card.Content>
        <Image src={imageURL} size="tiny" floated="left" />
        <Button
          icon="x"
          floated="right"
          onClick={() =>
            state.setCartItems(
              state.cartItems.filter(
                x => !(x.sku === item.sku && x.size === item.size)
              )
            )
          }
        />
        <Card.Header>
          {product.title} ({item.size})
        </Card.Header>
        <Card.Meta>{product.style}</Card.Meta>
        <Header size="large" color="blue">
          {priceDisp}
        </Header>
        <Header floated="left">Quantity: {item.quantity}</Header>
        <Button.Group size="mini">
          <Button
            icon="minus"
            disabled={item.quantity > 1 ? false : true}
            onClick={() => {
              state.setCartItems(
                state.cartItems.map(x => {
                  if (
                    x.sku === item.sku &&
                    x.size === item.size &&
                    x.quantity > 1
                  ) {
                    x.quantity--;
                    return x;
                  } else return x;
                })
              );
            }}
          />
          <Button
            icon="plus"
            disabled={!stockAvailable}
            onClick={() => {
              state.setCartItems(
                state.cartItems.map(x => {
                  if (
                    x.sku === item.sku &&
                    x.size === item.size &&
                    stockAvailable
                  ) {
                    x.quantity++;
                    return x;
                  } else return x;
                })
              );
            }}
          />
        </Button.Group>
      </Card.Content>
    </Card>
  );
};

const TotalCost = ({ cartItems }) => {
  let total = 0;
  if (cartItems) {
    cartItems.forEach(item => {
      total += item.price * item.quantity;
    });
    total = "$" + to2DP(total);
  }
  return cartItems ? total : "$0.00";
};

export default App;
