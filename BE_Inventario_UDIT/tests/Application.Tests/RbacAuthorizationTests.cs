using API.Controllers;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Linq;
using System.Reflection;
using Xunit;

namespace Application.Tests
{
    public class RbacAuthorizationTests
    {
        [Fact]
        public void InsumoController_ClassLevel_MustHaveAuthorizeAttribute()
        {
            var authAttr = typeof(InsumoController).GetCustomAttribute<AuthorizeAttribute>();
            Assert.NotNull(authAttr);
        }

        [Fact]
        public void MovimientoController_ClassLevel_MustHaveAuthorizeAttribute()
        {
            var authAttr = typeof(MovimientoController).GetCustomAttribute<AuthorizeAttribute>();
            Assert.NotNull(authAttr);
        }

        [Fact]
        public void AuditoriaController_ClassLevel_MustHaveAuthorizeAttribute()
        {
            var authAttr = typeof(AuditoriaController).GetCustomAttribute<AuthorizeAttribute>();
            Assert.NotNull(authAttr);
        }

        [Fact]
        public void UserController_ClassLevel_MustHaveAuthorizeAttribute()
        {
            var authAttr = typeof(UserController).GetCustomAttribute<AuthorizeAttribute>();
            Assert.NotNull(authAttr);
        }

        [Fact]
        public void InsumoController_Delete_MustRequireAdminRoleOnly()
        {
            var method = typeof(InsumoController).GetMethod(nameof(InsumoController.Delete));
            Assert.NotNull(method);

            var authAttr = method!.GetCustomAttribute<AuthorizeAttribute>();
            Assert.NotNull(authAttr);
            Assert.Equal("Admin", authAttr!.Roles);
        }

        [Fact]
        public void InsumoController_Unificar_MustRequireAdminOrDeveloper()
        {
            var method = typeof(InsumoController).GetMethod(nameof(InsumoController.UnificarDuplicados));
            Assert.NotNull(method);

            var authAttr = method!.GetCustomAttribute<AuthorizeAttribute>();
            Assert.NotNull(authAttr);
            Assert.Contains("Admin", authAttr!.Roles);
            Assert.Contains("Developer", authAttr.Roles);
            Assert.DoesNotContain("Assistant", authAttr.Roles);
            Assert.DoesNotContain("User", authAttr.Roles);
        }

        [Fact]
        public void InsumoController_CreateAndEdit_MustAllowAdminDeveloperAssistant()
        {
            var createMethod = typeof(InsumoController).GetMethod(nameof(InsumoController.Create));
            var updateMethod = typeof(InsumoController).GetMethod(nameof(InsumoController.Update));

            Assert.NotNull(createMethod);
            Assert.NotNull(updateMethod);

            var createAuth = createMethod!.GetCustomAttribute<AuthorizeAttribute>();
            var updateAuth = updateMethod!.GetCustomAttribute<AuthorizeAttribute>();

            Assert.NotNull(createAuth);
            Assert.NotNull(updateAuth);

            Assert.Equal("Admin,Developer,Assistant", createAuth!.Roles);
            Assert.Equal("Admin,Developer,Assistant", updateAuth!.Roles);
        }

        [Theory]
        [InlineData(nameof(MovimientoController.RegistrarIngreso))]
        [InlineData(nameof(MovimientoController.RegistrarSalida))]
        [InlineData(nameof(MovimientoController.RegistrarAjuste))]
        [InlineData(nameof(MovimientoController.RegistrarIngresoMasivo))]
        [InlineData(nameof(MovimientoController.PreviewExcel))]
        public void MovimientoController_TransactionEndpoints_MustRequireAdminDeveloperAssistant(string methodName)
        {
            var method = typeof(MovimientoController).GetMethod(methodName);
            Assert.NotNull(method);

            var authAttr = method!.GetCustomAttribute<AuthorizeAttribute>();
            Assert.NotNull(authAttr);
            Assert.Equal("Admin,Developer,Assistant", authAttr!.Roles);
        }

        [Fact]
        public void UserController_Delete_MethodMustExist()
        {
            var deleteMethod = typeof(UserController).GetMethod(nameof(UserController.Delete));
            Assert.NotNull(deleteMethod);
        }
    }
}
