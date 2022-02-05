<schema>
Customer(CustomerID, FirstName, LastName, StreetAddress, City, State, PostalCode, Country, Phone)
SaleItem(ProductID, ItemSize, SaleID, Quantity, SalePrice)
Sale(SaleID, SaleDate, CustomerID, Tax, Shipping)
SalaryEmployee(EmployeeID, Salary)
WageEmployee(EmployeeID, Wage, MaxHours)
Product(ProductID, ProductName, ManufacturerID, Composition, ListPrice, Gender, Category, Color, Description)
InventoryItem(ProductID, ItemSize, QtyOnHand)
ItemSize(ItemSize)
Employee(EmployeeID, FirstName, LastName, Address, City, State, ZIP, Phone, ManagerID, SSN, EmailAddress, HireDate)
Manufacturer(ManufacturerID, ManufacturerName, Address1, Address2, City, State, PostalCode, Phone, Fax, Contact, URL)
PurchaseItem(ProductID, ItemSize, PurchaseID, Quantity, PurchasePrice)
Purchase(PurchaseID, PurchaseDate, EmployeeID, ExpectedDeliveryDate, ManufacturerID, Shipping)
</schema>

select distinct C.FirstName, C.LastName
from Customer C
  join Sale S on S.CustomerID = C.CustomerID
  join SaleItem SI on SI.SaleID = S.SaleID
  join Product P on P.ProductID = SI.ProductID
  join Manufacturer M on M.ManufacturerID = P.ManufacturerID
where P.ListPrice > 60 and M.State = 'NJ'
